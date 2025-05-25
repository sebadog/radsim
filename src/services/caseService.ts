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
  // Validate required fields according to RLS policy
  const title = caseData.title?.trim();
  const clinicalInfo = caseData.clinicalInfo?.trim();
  const summaryOfPathology = caseData.summaryOfPathology?.trim();
  
  if (!title || title.length === 0) {
    throw new Error('Title is required and cannot be empty');
  }
  if (!clinicalInfo || clinicalInfo.length === 0) {
    throw new Error('Clinical information is required and cannot be empty');
  }
  if (!summaryOfPathology || summaryOfPathology.length === 0) {
    throw new Error('Summary of pathology is required and cannot be empty');
  }

  // Remove any empty strings from arrays to satisfy RLS policy
  const cleanExpectedFindings = (caseData.expectedFindings || [])
    .map(finding => finding.trim())
    .filter(finding => finding.length > 0);

  const cleanAdditionalFindings = (caseData.additionalFindings || [])
    .map(finding => finding.trim())
    .filter(finding => finding.length > 0);

  // Ensure we have at least one expected finding after cleaning
  if (!cleanExpectedFindings.length) {
    throw new Error('At least one non-empty expected finding is required');
  }

  // Generate a unique accession number (required by RLS policy)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const accessionNumber = `ACC${timestamp}${random}`;

  // Create image URLs array (empty if no images)
  const imageUrls = caseData.images ? caseData.images.map(file => URL.createObjectURL(file)) : [];

  const newCase = {
    title,
    accession_number: accessionNumber,
    clinical_info: clinicalInfo,
    expected_findings: cleanExpectedFindings,
    additional_findings: cleanAdditionalFindings,
    summary_of_pathology: summaryOfPathology,
    images: imageUrls,
    completed: false
  };

  const { data, error } = await supabase
    .from('cases')
    .insert(newCase)
    .select()
    .single();

  if (error) {
    console.error('Error creating case:', error);
    throw new Error(`Failed to create case: ${error.message}`);
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
      expected_findings: caseData.expectedFindings,
      additional_findings: caseData.additionalFindings,
      summary_of_pathology: caseData.summaryOfPathology,
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