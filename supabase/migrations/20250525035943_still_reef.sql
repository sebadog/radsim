/*
  # Create initial radiology cases

  1. New Cases
    - Creates 5 initial radiology cases with detailed clinical information
    - Each case includes:
      - Title
      - Accession number
      - Clinical information
      - Expected findings
      - Additional findings
      - Summary of pathology
      - Default placeholder image

  2. Data Structure
    - Uses text arrays for findings
    - Includes timestamps for created_at and updated_at
    - Sets completed status to false by default
*/

INSERT INTO cases (
  title,
  accession_number,
  clinical_info,
  expected_findings,
  additional_findings,
  summary_of_pathology,
  images,
  completed
) VALUES
-- Case 1: CT L Spine
(
  'CT L Spine',
  '10678299891',
  '79F. Low back pain radiating down both legs, worse on the left. History of ovarian cancer. Assess for spinal metastases or other causes.',
  ARRAY[
    'Severe spinal canal stenosis at L4-L5.',
    'Insufficiency fracture of the sacrum.'
  ],
  ARRAY[
    'Osteoporotic appearance of the lumbar spine with decreased bone density and slightly prominent vertical trabeculae.',
    'No evidence of bony metastases.',
    'Bilateral cortical renal cysts.',
    'Tiny non-obstructing 3 mm calculus in the upper pole of the right kidney.',
    'Calcified deposit along the surface of the spleen.',
    'Calcified atherosclerosis of the abdominal aorta and iliac arteries.',
    'Partially imaged calcified pelvic mass, likely uterine leiomyoma.',
    'Severe degenerative changes of the facet joints at L4-L5 causing anterolisthesis, severe spinal canal stenosis, and severe foraminal stenosis with compression of the exiting L4 nerve roots, worse on the left.'
  ],
  'Severe degenerative changes of the facet joints at L4-L5 causing anterolisthesis, spinal canal stenosis, and foraminal stenosis with compression of the L4 nerve roots, worse on the left. Insufficiency fracture of the sacrum.',
  ARRAY['https://medlineplus.gov/images/Xray_share.jpg'],
  false
),

-- Case 2: MRI C Spine
(
  'MRI C Spine',
  '10675963947',
  'Hemiplegia.',
  ARRAY[
    'Transdiscal fracture at C5-C6 with likely involvement of posterior elements and cord compression at C5.',
    'Background of marked ankylosis of the cervical and thoracic spine (rigid spine).',
    'Subdural hematomas in the bilateral cerebral convexities.'
  ],
  ARRAY[
    'Prevertebral edema.',
    'Tiny cystic lesion in the posterior pituitary gland.',
    'C4-C5 left paracentral/subarticular disc-osteophyte complex mildly impinging on the cord.',
    'Severe bilateral foraminal stenosis at C4-C5 with likely C5 nerve root involvement.',
    'Severe bilateral foraminal stenosis at C5-C6 with likely C6 nerve root involvement.',
    'C6-C7 right-central osteophyte slightly impinging on the cord.',
    'Degenerative changes with multilevel foraminal stenosis.',
    'Bone marrow edema and enhancement of the C5-C6 endplates and posterior elements.',
    'Edema/enhancement of posterior soft tissues.',
    'Multiple vertebral hemangiomas.',
    'Bilateral pleural effusions, right > left.'
  ],
  'Transdiscal fracture at C5-C6 with likely involvement of posterior elements, in keeping with an unstable fracture. Moderate cord compression at C5 without signal abnormality. Marked ankylosis of the cervical and thoracic spine, possibly related to ankylosing spondylitis. Bilateral subdural hematomas along the occipital lobes and left inferior temporal lobe.',
  ARRAY['https://medlineplus.gov/images/Xray_share.jpg'],
  false
),

-- Case 3: CT L Spine Post-op
(
  'CT L Spine',
  '10677039787',
  '57M. Post op posterior decompression and instrumented fusion. Low back pain.',
  ARRAY[
    'Multiple L2 fractures.',
    'Right L3 transverse process fracture.',
    'Exophytic left renal mass.'
  ],
  ARRAY[
    'Posterior decompression and instrumentation from L2–S1 with rods and transpedicular screws.',
    'Right convex lateral scoliosis.',
    'Mild vertebral body height loss of L1.',
    'Chronic corticated fracture of the anterior L4 vertebral body.',
    'Scattered air locules in the posterior soft tissues around laminectomy sites.',
    'Atherosclerotic disease of the abdominal aorta.'
  ],
  'Nondisplaced fracture of the posterior L2 vertebral body extending from the superior endplate to the posterior cortex, involving the right pedicle, proximal transverse process, and lamina. Minimally displaced fracture of the right L3 transverse process. Exophytic mass arising from the lower pole of the left kidney. Recommend contrast-enhanced CT abdomen/pelvis and urology consultation.',
  ARRAY['https://medlineplus.gov/images/Xray_share.jpg'],
  false
),

-- Case 4: MRI Brain
(
  'MRI Brain',
  '1067768106781',
  '42F. Previously resected right frontal astrocytoma. Surveillance.',
  ARRAY[
    'No evidence of recurrent astrocytoma.',
    'Sinonasal mass with intracranial extension.'
  ],
  ARRAY[
    'Right frontal craniotomy with underlying extra-axial collection and thick dural enhancement.',
    'Cystic encephalomalacia within the resection cavity.',
    'Moderate FLAIR hyperintensity surrounding the cavity in the right frontal lobe.',
    'Multiple foci of susceptibility in bilateral cerebral white matter, likely post-radiation vascular changes.',
    'Post-obstructive opacification of the right frontal, maxillary, and sphenoid sinuses.',
    'Heterogeneous sinonasal mass centered in the right nasal cavity, extending to the nasopharynx, ethmoid air cells, and sphenoid sinus.'
  ],
  'Post-surgical changes of the right frontal lobe resection cavity. No evidence of recurrent mass. Large heterogeneous sinonasal mass centered in the right nasal cavity with intracranial extension through the cribriform plate.',
  ARRAY['https://medlineplus.gov/images/Xray_share.jpg'],
  false
),

-- Case 5: MRI Brain MSA
(
  'MRI Brain',
  '10678366437',
  '76M. History of L-Dopa–resistant parkinsonism with rapid progression over 3 years. Rule out MSA.',
  ARRAY[
    'Bilateral atrophy of the putamen.',
    'Susceptibility artifact in the posterolateral putamen.',
    'Cerebellar atrophy.',
    'Overall findings compatible with multiple system atrophy (MSA).'
  ],
  ARRAY[
    'Mild global cortical atrophy.',
    'Atrophy of the middle cerebellar peduncles.',
    'T2/FLAIR hyperintense rim in the lateral putamen (putaminal rim sign).',
    'Scattered non-specific high T2/FLAIR white matter signal abnormalities suggestive of microangiopathy.'
  ],
  'Marked putaminal atrophy with posterolateral susceptibility artifact and cerebellar atrophy, compatible with MSA. Findings support both parkinsonian and cerebellar variants.',
  ARRAY['https://medlineplus.gov/images/Xray_share.jpg'],
  false
);