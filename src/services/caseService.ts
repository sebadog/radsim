import { v4 as uuidv4 } from 'uuid';
import { Case, cases } from '../data/cases';

// In-memory storage for new cases
let localCases = [...cases];

export interface CaseFormData {
  title: string;
  clinicalInfo: string;
  expectedFindings: string[];
  additionalFindings: string[];
  summaryOfPathology: string;
  images: File[];
}

export async function fetchCases(): Promise<Case[]> {
  return localCases;
}

export async function fetchCaseById(id: string): Promise<Case | null> {
  const foundCase = localCases.find(c => c.id === id);
  return foundCase || null;
}

export async function createCase(caseData: CaseFormData): Promise<string> {
  // Generate a new case ID
  const newId = `case${localCases.length + 1}`;
  
  // Create image URLs from files (in a real app, these would be uploaded to storage)
  const imageUrls = caseData.images.map(file => URL.createObjectURL(file));
  
  // Create the new case
  const newCase: Case = {
    id: newId,
    title: caseData.title,
    accessionNumber: uuidv4().substring(0, 10),
    clinicalInfo: caseData.clinicalInfo,
    expectedFindings: caseData.expectedFindings,
    additionalFindings: caseData.additionalFindings,
    summaryOfPathology: caseData.summaryOfPathology,
    images: imageUrls,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completed: false
  };
  
  // Add to local cases
  localCases = [...localCases, newCase];
  
  return newId;
}

export async function updateCase(id: string, caseData: CaseFormData): Promise<string> {
  // Find the case to update
  const caseIndex = localCases.findIndex(c => c.id === id);
  
  if (caseIndex === -1) {
    throw new Error('Case not found');
  }
  
  // Get the existing case
  const existingCase = localCases[caseIndex];
  
  // Create image URLs from files (in a real app, these would be uploaded to storage)
  const newImageUrls = caseData.images.map(file => URL.createObjectURL(file));
  
  // Create the updated case
  const updatedCase: Case = {
    ...existingCase,
    title: caseData.title,
    clinicalInfo: caseData.clinicalInfo,
    expectedFindings: caseData.expectedFindings,
    additionalFindings: caseData.additionalFindings,
    summaryOfPathology: caseData.summaryOfPathology,
    images: [...(existingCase.images || []), ...newImageUrls],
    updatedAt: new Date().toISOString()
  };
  
  // Update the case in the array
  localCases = [
    ...localCases.slice(0, caseIndex),
    updatedCase,
    ...localCases.slice(caseIndex + 1)
  ];
  
  return id;
}

export async function deleteCase(id: string): Promise<boolean> {
  // Filter out the case to delete
  localCases = localCases.filter(c => c.id !== id);
  return true;
}

export async function markCaseAsCompleted(id: string, completed: boolean): Promise<boolean> {
  // Find the case to update
  const caseIndex = localCases.findIndex(c => c.id === id);
  
  if (caseIndex === -1) {
    throw new Error('Case not found');
  }
  
  // Get the existing case
  const existingCase = localCases[caseIndex];
  
  // Create the updated case with completed status
  const updatedCase: Case = {
    ...existingCase,
    completed,
    updatedAt: new Date().toISOString()
  };
  
  // Update the case in the array
  localCases = [
    ...localCases.slice(0, caseIndex),
    updatedCase,
    ...localCases.slice(caseIndex + 1)
  ];
  
  return true;
}