import { createClient } from '@supabase/supabase-js';
import { Case } from '../types/case';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export interface CaseFormData {
  title: string;
  clinicalInfo: string;
  expectedFindings: string[];
  additionalFindings: string[];
  summaryOfPathology: string;
  imageUrl: string;
  surveyUrl: string;
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
  const title = caseData.title?.trim();
  const clinicalInfo = caseData.clinicalInfo?.trim();
  const summaryOfPathology = caseData.summaryOfPathology?.trim();
  const expectedFindings = caseData.expectedFindings.filter(f => f.trim());
  const additionalFindings = caseData.additionalFindings.filter(f => f.trim());

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const accessionNumber = `ACC${timestamp}${random}`;

  const imageUrls = caseData.imageUrl 
    ? [caseData.imageUrl]
    : ['https://medlineplus.gov/images/Xray_share.jpg'];

  const newCase = {
    title,
    accession_number: accessionNumber,
    clinical_info: clinicalInfo,
    expected_findings: expectedFindings,
    additional_findings: additionalFindings,
    summary_of_pathology: summaryOfPathology,
    images: imageUrls,
    survey_url: caseData.surveyUrl,
    completed: false
  };

  const { data, error } = await supabase
    .from('cases')
    .insert([newCase])
    .select()
    .single();

  if (error) {
    console.error('Error creating case:', error.message);
    throw new Error(`Failed to create case: ${error.message}`);
  }

  return data.id;
}

export async function updateCase(id: string, caseData: CaseFormData): Promise<string> {
  const title = caseData.title?.trim();
  const clinicalInfo = caseData.clinicalInfo?.trim();
  const summaryOfPathology = caseData.summaryOfPathology?.trim();
  const expectedFindings = caseData.expectedFindings.filter(f => f.trim());
  const additionalFindings = caseData.additionalFindings.filter(f => f.trim());

  const imageUrls = caseData.imageUrl 
    ? [caseData.imageUrl]
    : ['https://medlineplus.gov/images/Xray_share.jpg'];
  
  const { data, error } = await supabase
    .from('cases')
    .update({
      title,
      clinical_info: clinicalInfo,
      expected_findings: expectedFindings,
      additional_findings: additionalFindings,
      summary_of_pathology: summaryOfPathology,
      images: imageUrls,
      survey_url: caseData.surveyUrl,
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