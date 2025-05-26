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
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  // Fetch cases and their completion status for the current user
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      case_completion!inner (
        completed,
        completed_at
      )
    `)
    .eq('case_completion.user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cases:', error);
    throw new Error('Failed to fetch cases');
  }

  return data.map(caseItem => ({
    ...caseItem,
    completed: caseItem.case_completion?.[0]?.completed || false
  })) || [];
}

export async function fetchCaseById(id: string): Promise<Case | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  // Fetch case and its completion status for the current user
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      case_completion!inner (
        completed,
        completed_at
      )
    `)
    .eq('id', id)
    .eq('case_completion.user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching case:', error);
    throw new Error('Failed to fetch case');
  }

  return data ? {
    ...data,
    completed: data.case_completion?.[0]?.completed || false
  } : null;
}

export async function createCase(caseData: CaseFormData): Promise<Case> {
  try {
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

    const { data, error } = await supabase
      .from('cases')
      .insert([{
        title,
        accession_number: accessionNumber,
        clinical_info: clinicalInfo,
        expected_findings: expectedFindings,
        additional_findings: additionalFindings,
        summary_of_pathology: summaryOfPathology,
        images: imageUrls,
        survey_url: caseData.surveyUrl
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating case:', error);
      throw new Error('Failed to create case');
    }

    if (!data) {
      throw new Error('No data returned after creating case');
    }

    return data;
  } catch (error) {
    console.error('Error in createCase:', error);
    throw error;
  }
}

export async function updateCase(id: string, caseData: CaseFormData): Promise<Case> {
  try {
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

    if (!data) {
      throw new Error('No data returned after updating case');
    }

    return data;
  } catch (error) {
    console.error('Error in updateCase:', error);
    throw error;
  }
}

export async function deleteCase(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting case:', error);
      throw new Error('Failed to delete case');
    }
  } catch (error) {
    console.error('Error in deleteCase:', error);
    throw error;
  }
}

export async function markCaseAsCompleted(caseId: string, completed: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  try {
    const { error } = await supabase
      .from('case_completion')
      .upsert({
        user_id: user.id,
        case_id: caseId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating case completion:', error);
      throw new Error('Failed to update case completion status');
    }
  } catch (error) {
    console.error('Error in markCaseAsCompleted:', error);
    throw error;
  }
}