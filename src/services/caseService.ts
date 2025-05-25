import { createClient } from '@supabase/supabase-js';
import { Case } from '../types/case';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export interface CaseFormData {
  title: string;
  clinicalInfo: string;
  expectedFindings: string[];
  additionalFindings: string[];
  summaryOfPathology: string;
  images: File[];
}

export async function fetchCases(): Promise<Case[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cases:', error);
    throw new Error('Failed to fetch cases');
  }

  return data || [];
}

export async function fetchCaseById(id: string): Promise<Case | null> {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching case:', error);
    throw new Error('Failed to fetch case');
  }

  return data;
}

export async function createCase(caseData: CaseFormData): Promise<string> {
  // Create image URLs from files (in a real app, these would be uploaded to storage)
  const imageUrls = caseData.images.map(file => URL.createObjectURL(file));
  
  const { data, error } = await supabase
    .from('cases')
    .insert({
    title: caseData.title,
    accession_number: Math.random().toString(36).substring(2, 12).toUpperCase(),
    clinical_info: caseData.clinicalInfo,
    expectedFindings: caseData.expectedFindings,
    additionalFindings: caseData.additionalFindings,
    summaryOfPathology: caseData.summaryOfPathology,
    images: imageUrls
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating case:', error);
    throw new Error('Failed to create case');
  }
  
  return data.id;
}

export async function updateCase(id: string, caseData: CaseFormData): Promise<string> {
  // Create image URLs from files (in a real app, these would be uploaded to storage)
  const newImageUrls = caseData.images.map(file => URL.createObjectURL(file));
  
  const { data, error } = await supabase
    .from('cases')
    .update({
    title: caseData.title,
    clinical_info: caseData.clinicalInfo,
    expectedFindings: caseData.expectedFindings,
    additionalFindings: caseData.additionalFindings,
    summaryOfPathology: caseData.summaryOfPathology,
    images: newImageUrls,
    updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating case:', error);
    throw new Error('Failed to update case');
  }
  
  return id;
}

export async function deleteCase(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting case:', error);
    throw new Error('Failed to delete case');
  }

  return true;
}

export async function markCaseAsCompleted(id: string, completed: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('cases')
    .update({ 
      completed,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating case completion:', error);
    throw new Error('Failed to update case completion status');
  }

  return true;
}