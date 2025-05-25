export interface Case {
  id: string;
  title: string;
  accessionNumber: string;
  clinicalInfo: string;
  expectedFindings: string[];
  additionalFindings: string[];
  summaryOfPathology: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  completed?: boolean;
}

// Standard X-ray placeholder image
const placeholderImage = "https://medlineplus.gov/images/Xray_share.jpg";

export const cases: Case[] = [
  {
    id: "case1",
    title: "CT L Spine",
    accessionNumber: "10678299891",
    clinicalInfo: "79F. Low back pain radiating down both legs. Worse on left. Hx ovarian CA. Assess for obvious spinal mets/other cause.",
    expectedFindings: [
      "Severe degenerative changes of the facet joints at L4-L5 causing anterolisthesis, severe spinal canal stenosis and severe foraminal stenosis with compression of the exiting L4 nerve roots, worse on the left.",
      "Insufficiency fracture of the sacrum."
    ],
    additionalFindings: [
      "Osteoporotic appearance of the lumbar spine with decreased density and slightly increased vertical trabeculae.",
      "No evidence of bony metastases.",
      "Bilateral cortical renal cysts. Tiny nonobstructing 3mm calculus at the right kidney upper pole. Calcified deposit along the surface of the spleen.",
      "Calcified atherosclerosis of the abdominal aorta and iliac arteries.",
      "Partially imaged calcified mass in the pelvis most in keeping with uterine leiomyoma."
    ],
    summaryOfPathology: "In addition to the severe spinal canal and foraminal stenosis at L4-L5, this case illustrates a sacral insufficiency fracture with fracture lines along the bilateral sacral alae and a horizontal sclerotic component at S2. Sacral insufficiency fractures often present with lower back, pelvic, or buttock pain and may be missed on radiographs and CT. CT scans can reveal linear fracture lines or sclerosis in the sacral ala and sacral body, often forming an \"H-shaped\" pattern. MRI is highly sensitive, showing low signal intensity on T1-weighted images and high signal intensity on T2/STIR images due to bone marrow edema. Bone scintigraphy also aids in diagnosis with increased radiotracer uptake in an \"H\" pattern.",
    images: [placeholderImage, placeholderImage, placeholderImage, placeholderImage],
    completed: false
  },
  {
    id: "case2",
    title: "MRI C Spine",
    accessionNumber: "10675963947",
    clinicalInfo: "Hemplegia. Normal brain MRI.",
    expectedFindings: [
      "Transdiscal fracture at C5-C6 with likely involvement of the posterior elements in keeping with an unstable fracture. There is moderate cord compression at C5. No evidence of underlying spinal cord edema or myelomalacia.",
      "Background of marked ankylosis of the cervical and thoracic spine (rigid spine). This may be related to ankylosing spondylosis."
    ],
    additionalFindings: [
      "Bilateral subdural hematomas along the bilateral occipital and left inferior temporal lobes.",
      "Prevertebral edema",
      "Tiny cystic lesion in the posterior pituitary gland",
      "C4-C5 left paracentral or subarticular disc-osteophyte complex slightly impinging upon the spinal cord. Severe bilateral foraminal stenosis with likely involvement of bilateral C5 nerve roots.",
      "C5-C6 severe bilateral foraminal stenosis with likely involvement of bilateral C6 nerve roots.",
      "C6-C7 right-central osteophyte slightly impinging upon the spinal cord.",
      "Degenerative changes with multisegmental foraminal stenosis."
    ],
    summaryOfPathology: "Transdiscal fractures in a rigid spine, often seen in conditions like ankylosing spondylitis or diffuse idiopathic skeletal hyperostosis (DISH), are serious injuries. The rigidity of the spine increases the risk of fractures extending through the intervertebral disc and adjacent vertebrae. These fractures can lead to severe pain, spinal instability, and neurological deficits. CT and MRI are usually required to assess the full extent of the injury. Prompt and appropriate management is essential to stabilize the spine and prevent further complications.",
    images: [placeholderImage, placeholderImage, placeholderImage, placeholderImage],
    completed: false
  },
  {
    id: "case3",
    title: "CT L Spine",
    accessionNumber: "10677039787",
    clinicalInfo: "57M. Post op posterior decompression and instrumented fusion. Low back pain.",
    expectedFindings: [
      "Nondisplaced fracture involving the posterior L2 vertebral body along the superior endplate and extending to the posterior cortex. The fracture involves the right pedicle. There are additional fractures involving the proximal transverse process and lamina of L2.",
      "Minimally displaced fracture of the right L3 transverse process.",
      "Exophytic 5.2 cm renal mass arising from the lower pole of the left kidney, most concerning for RCC. Further evaluation with contrast enhanced CT abdomen pelvis is recommended and urology consultation."
    ],
    additionalFindings: [
      "Posterior decompression and instrumentation with posterior rod and interpedicular screw fixation spanning L2 – S1",
      "Right convex lateral scoliosis",
      "Mild vertebral body height loss of L1",
      "Chronic corticated fracture traversing anterior L4 vertebral body",
      "Scattered locules of air in the posterior soft tissues around the laminectomies.",
      "Scattered atherosclerotic disease of the abdominal aorta"
    ],
    summaryOfPathology: "Renal cell carcinoma (RCC) is the most common type of kidney cancer in adults, originating in the cells lining the tubules of the kidney. It often does not cause symptoms in its early stages and may be incidentally discovered during imaging tests performed for other reasons, such as in this case where it was detected during a CT scan of the lumbar spine. RCC can spread to other organs and tissues, making early detection and treatment crucial for better outcomes. Radiologically, it appears as a solid renal mass with various enhancing patterns on contrast-enhanced CT scans. RCC can be heterogeneous in appearance, often demonstrating areas of necrosis, hemorrhage, or calcification. It frequently extends into the renal vein and can spread to adjacent structures such as the renal sinus, perinephric fat, and lymph nodes. Radiologists should meticulously examine the paraspinal soft tissues and corners of the images to avoid missing crucial findings.",
    images: [placeholderImage, placeholderImage, placeholderImage, placeholderImage],
    completed: false
  },
  {
    id: "case4",
    title: "MRI Brain",
    accessionNumber: "1067768106781",
    clinicalInfo: "42F. Previously resected right frontal astrocytoma. Surveillance.",
    expectedFindings: [
      "Right frontal lobe resection cavity with surrounding post-surgical changes. No evidence of recurrent mass.",
      "Large heterogenous sinonasal mass centered within the right nasal cavity extending into the right nasopharynx, ethmoid air cells and sphenoid sinus. The mass extends superiorly through the cribriform plate to involve the skull base."
    ],
    additionalFindings: [
      "Right frontal craniotomy with an extra-axial collection underlying the craniotomy flap and associated thick dural enhancement. Cystic encephalomalacia noted within the resection cavity. Moderate FLAIR hyperintense signal surrounding the resection cavity within the right frontal lobe.",
      "Multiple foci of susceptibility scattered in bilateral cerebral white matter bilaterally are likely postradiation vascular abnormalities (telangiectasia/cavernous angiomas).",
      "Post-obstructive opacification of the right frontal, maxillary and sphenoid sinuses."
    ],
    summaryOfPathology: "Sinonasal masses encompass a spectrum of pathologies, ranging from benign inflammatory polyps to potentially malignant tumors. These masses typically appear on CT scans as soft tissue densities within the nasal cavity and paranasal sinuses. Benign polyps often present as smoothly marginated, non-enhancing masses, while more aggressive or malignant lesions may demonstrate irregular borders, bony erosion, and contrast enhancement. Sinonasal masses often present with nonspecific symptoms such as nasal obstruction, sinusitis-like symptoms, or epistaxis. Imaging modalities like CT scans are crucial for initial detection and monitoring of these masses. However, their interpretation can be complex, especially when lesions are partially visualized or overlooked due to their subtle appearance. In this instance, the delayed diagnosis underscores the importance of thorough radiological review and clinical follow-up, as timely detection can significantly impact treatment outcomes and patient prognosis.",
    images: [placeholderImage, placeholderImage, placeholderImage, placeholderImage],
    completed: false
  },
  {
    id: "case5",
    title: "MRI Brain",
    accessionNumber: "10678366437",
    clinicalInfo: "76M. History of Parkinsonism with rounded progression with ileus. Rule out SAH and signs of MSA.",
    expectedFindings: [
      "Mild atrophy of the putamen with associated susceptibility weighted artifact and findings in keeping with the T2 putaminal rim sign. Diffuse atrophy of the brainstem, superior and middle cerebellar peduncles. Overall, features are compatible with multisystem atrophy-P (MSA-P)."
    ],
    additionalFindings: [
      "Mild global cortical atrophy.",
      "Non-specific scattered foci of high T2/FLAIR white matter signal abnormalities, suggestive of microangiopathy."
    ],
    summaryOfPathology: "Multiple system atrophy (MSA) is a progressive neurodegenerative disorder characterized by Parkinsonism, autonomic dysfunction, cerebellar, and pyramidal symptoms. MSA-P, the predominant subtype, primarily manifests with Parkinsonism and minimal cerebellar signs initially. Brain MRI plays a pivotal role in identifying specific features of MSA-P. Notably, MRI often reveals putaminal changes and infratentorial atrophy. The putaminal hyperintense rim sign observed on T2-weighted images is a key characteristic (T2 putaminal rim sign). This finding, while highly specific for MSA-P, can occasionally be encountered in other neurodegenerative conditions or even in healthy individuals, highlighting the importance of integrating clinical and radiological findings for accurate diagnosis and management of MSA-P.",
    images: [placeholderImage, placeholderImage, placeholderImage, placeholderImage],
    completed: false
  }
];