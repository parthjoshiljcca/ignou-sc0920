/**
 * Default FAQs for students of Study Centre 0920.
 * Source: IGNOU "Frequently Asked Questions" (official PDF on ignou.ac.in,
 * https://www.ignou.ac.in/viewFile/ad/sou_moto/IGNOU-FAQs.pdf). Fees, dates and links are kept as stated there;
 * the coordinator can edit any of them from Admin → FAQs when IGNOU changes a rule.
 */
export type DefaultFaq = { category: string; question: string; answer: string; link?: string };

export const FAQ_CATEGORIES = [
  "Using this app",
  "Admission & Student Portal",
  "ID Card",
  "Study Material",
  "Counselling & Study Centre",
  "Re-registration",
  "Assignments & Exams",
  "Results & Grade Card",
  "Changes & Corrections",
  "Fee, Refund & Scholarships",
  "Certificates & Credit Transfer",
  "Help & Grievances",
] as const;

export const DEFAULT_FAQS: DefaultFaq[] = [
  // ---- Using this app ----
  {
    category: "Using this app",
    question: "How do I ask the study centre a question?",
    answer:
      "Open Help Desk → New query, choose a category and describe your issue (course code, dates, what you have tried). The coordinator replies inside the app and you get a notification. You can reply in the same thread until it is solved.",
  },
  {
    category: "Using this app",
    question: "How do I get alerts for classes, notices and replies on my phone?",
    answer:
      "Install the app (Add to Home Screen) and tap “Turn on alerts” on the Home screen, or go to Profile → Notifications. On iPhone, alerts work only after the app is added to the Home Screen.",
  },
  {
    category: "Using this app",
    question: "I forgot my password for this app. What should I do?",
    answer:
      "Contact the study centre (or ask someone to raise a query for you). The coordinator will reset your password to your registered mobile number; you will set a new one on next sign-in.",
  },
  // ---- Admission & Student Portal ----
  {
    category: "Admission & Student Portal",
    question: "My admission is confirmed. What should I do next?",
    answer:
      "Follow the instructions in your confirmation email. Register on the IGNOU Student Portal (https://ignou.samarth.edu.in) by clicking “New Registration” and create your own student account — you can access many services through it. You will receive information about the induction meeting and counselling sessions from your Regional Centre / Learner Support Centre.",
    link: "https://ignou.samarth.edu.in",
  },
  {
    category: "Admission & Student Portal",
    question: "How can I check my admission / registration details?",
    answer:
      "Log in to your student account at https://ignou.samarth.edu.in. You can also check on the IGNOU website: www.ignou.ac.in → Student Support → Student Zone → Admission → Know Your Admission/Registration Details.",
    link: "https://ignou.samarth.edu.in",
  },
  {
    category: "Admission & Student Portal",
    question: "I can't register on the Student Portal because my email/mobile is wrong and I don't get the OTP.",
    answer: "Contact your Regional Centre to get your email / mobile number updated in IGNOU records.",
  },
  {
    category: "Admission & Student Portal",
    question: "What are the minimum and maximum durations of programmes?",
    answer:
      "Post Graduate Degree: minimum 2 years, maximum 4 years.\nUnder Graduate Degree: minimum 3 years, maximum 6 years.\nDiploma / PG Diploma: minimum 1 year, maximum 3 years.\nCertificate: minimum 6 months, maximum 2 years.\nProgrammes approved by regulatory bodies (NCTE/INC/AICTE) follow those bodies' norms.",
  },
  {
    category: "Admission & Student Portal",
    question: "I couldn't finish my programme within the maximum duration. Can I get an extension?",
    answer: "No. IGNOU does not permit any extension beyond the maximum duration of the programme.",
  },
  {
    category: "Admission & Student Portal",
    question: "Can I change my programme after admission?",
    answer:
      "No, change of programme is not permitted. If you don't wish to continue, you may request cancellation of admission and take fresh admission in the programme of your choice. Any refund is governed by IGNOU's Refund Policy.",
  },
  {
    category: "Admission & Student Portal",
    question: "Can I pursue two programmes at the same time?",
    answer:
      "In certain cases, yes. Two UG/PG degree programmes in ODL mode are allowed only in two separate admission cycles. A certificate programme of 6 months can be pursued along with any other programme (maximum two programmes). Programmes under AICTE/NCTE/INC and some collaborative programmes are not allowed simultaneously. If courses are common, their credits count for one programme only. See the Common Prospectus for the full rules.",
  },
  // ---- ID Card ----
  {
    category: "ID Card",
    question: "Where do I get my IGNOU identity card?",
    answer:
      "After admission confirmation, log in to your account on the Online Admission portal and download your identity card. Take a printout (preferably colour), get it laminated and keep it with you. You need it with your hall ticket at the exam centre.",
    link: "https://ignouadmission.samarth.edu.in",
  },
  {
    category: "ID Card",
    question: "Does the identity card need to be attested?",
    answer: "No, attestation is not required.",
  },
  // ---- Study material ----
  {
    category: "Study Material",
    question: "How will I get my study material?",
    answer:
      "Study material is sent by IGNOU's Material Production and Distribution Division (MPDD) by India Post, or given by your Regional Centre. You will get an SMS with the barcode once the parcel is booked. You can check the dispatch status on the IGNOU website.",
    link: "http://ignou.ac.in/ignou/aboutignou/division/mpdd/material",
  },
  {
    category: "Study Material",
    question: "My books haven't arrived yet. How can I study?",
    answer:
      "Use the digital study material on eGyanKosh (https://egyankosh.ac.in) or the IGNOU e-Content App until your printed material reaches you.",
    link: "https://egyankosh.ac.in",
  },
  {
    category: "Study Material",
    question: "How do I track my study material parcel?",
    answer:
      "Use the barcode from the SMS on the India Post website. Tracking is available there for three months from booking. If it shows “Consignment not found”, contact your Regional Centre in person or by email with your details.",
  },
  {
    category: "Study Material",
    question: "Whom do I contact if my study material is badly delayed or not received?",
    answer:
      "Write to the Registrar (MPDD), IGNOU, Maidan Garhi, New Delhi – 110068, or email registrarmpdd@ignou.ac.in. The Student Support Cell at MPDD can also be reached at mpdd@ignou.ac.in or 011-29572008 / 011-29572012.",
  },
  {
    category: "Study Material",
    question: "Is there any benefit in choosing digital study material?",
    answer: "Yes. IGNOU gives a 15% concession in programme fee to students who opt for digital study material instead of printed material.",
  },
  // ---- Counselling & Study Centre ----
  {
    category: "Counselling & Study Centre",
    question: "When are counselling sessions held?",
    answer:
      "Academic counselling (theory and practical, wherever applicable) is held at the study centre as per its schedule — normally on Saturdays, Sundays and holidays, and sometimes on weekday mornings/evenings depending on the programme. The schedule for your programme is in the Classes tab of this app.",
  },
  {
    category: "Counselling & Study Centre",
    question: "Is the study centre open on a holiday that falls on a weekend?",
    answer: "It is closed on National Holidays. For other holidays, follow the notice issued by the study centre (see Notices in this app).",
  },
  {
    category: "Counselling & Study Centre",
    question: "Can I use the library?",
    answer:
      "Yes. Your study centre has library/multimedia facilities you can use during its working hours. If you live in the Regional Centre's city you can also use the Regional Centre library and its recorded audio/video lectures.",
  },
  // ---- Re-registration ----
  {
    category: "Re-registration",
    question: "How do I register for the next semester / year?",
    answer:
      "This is called Re-registration (for Bachelor's and Master's degrees, and some semester-based Diplomas). Re-register online as per the schedule: www.ignou.ac.in → Register online → Re-registration, or from your account on the Student Portal (https://ignou.samarth.edu.in).",
    link: "https://ignou.samarth.edu.in",
  },
  {
    category: "Re-registration",
    question: "Do I have to pass the previous semester/year before re-registering?",
    answer:
      "No. You can re-register for the next semester/year whether or not you have submitted assignments or appeared in the exams of earlier semesters/years. IGNOU strongly recommends re-registering every cycle without a break so you can finish in the minimum time.",
  },
  // ---- Assignments & exams ----
  {
    category: "Assignments & Exams",
    question: "When are term-end examinations held, and who can appear?",
    answer:
      "Term-End Examinations (TEE) are held twice a year, in June and December. You can appear in a course if your registration for it is valid, the minimum period of study is over, the maximum duration has not ended, and you have submitted the required assignments for that course by the due date.",
  },
  {
    category: "Assignments & Exams",
    question: "Do I have to submit assignments before the exam?",
    answer:
      "Yes. You are allowed to appear in the term-end exam of a course only if you have submitted the required assignment(s) for it by the due date. Watch Notices in this app for the study centre's submission dates.",
  },
  {
    category: "Assignments & Exams",
    question: "When and how do I fill the exam form? What is the fee?",
    answer:
      "The exam form is filled online. Exam fee is Rs. 200 per course (theory or practical), paid online. For June TEE: 1–31 March without late fee; 1–20 April with Rs. 500; 21–30 April with Rs. 1000. For December TEE: 1–30 September without late fee; 1–20 October with Rs. 500; 21–31 October with Rs. 1000. After that (May / November) a hard-copy form with demand draft goes to the Regional Centre, subject to availability of question papers. Always check the latest IGNOU notice for current dates.",
    link: "https://www.ignou.ac.in",
  },
  {
    category: "Assignments & Exams",
    question: "Where will my exam centre be?",
    answer:
      "Normally your study centre is the exam centre, but you must fill an exam centre code in the exam form (see the list on the exam form portal). If the centre you choose is not activated, IGNOU allots another centre in the same Region.",
  },
  {
    category: "Assignments & Exams",
    question: "How do I get my hall ticket?",
    answer:
      "IGNOU uploads hall tickets at least ten days before the term-end exam starts. Download it from www.ignou.ac.in and take it with your IGNOU Student Identity Card to the exam centre.",
    link: "https://www.ignou.ac.in",
  },
  // ---- Results ----
  {
    category: "Results & Grade Card",
    question: "When are results declared?",
    answer:
      "June TEE results are usually declared in August/September, and December TEE results in February/March of the next year. Results of assignments, projects, practicals, viva etc. are declared along with the term-end theory results.",
  },
  {
    category: "Results & Grade Card",
    question: "I lost my grade card / marks statement. What should I do?",
    answer:
      "You can get a duplicate grade card / statement of marks by paying the prescribed fee through a demand draft in favour of “IGNOU” payable at New Delhi, submitted to the Registrar, SED, Block No. 12, IGNOU, Maidan Garhi, New Delhi – 110068.",
  },
  // ---- Changes ----
  {
    category: "Changes & Corrections",
    question: "How do I change my address, study centre or regional centre?",
    answer:
      "You can request change of address, study centre and regional centre online from your account on https://ignou.samarth.edu.in (create it with “New Registration” if you haven't). You can also contact your Regional Centre. Details: Common Prospectus, point 10.20.",
    link: "https://ignou.samarth.edu.in",
  },
  {
    category: "Changes & Corrections",
    question: "How do I correct a spelling mistake or change my name/surname?",
    answer:
      "Typing errors in your name can be corrected by requesting your Regional Centre. To change name/surname after admission, apply at your Regional Centre with: original newspaper notification of the change, original affidavit on non-judicial stamp paper sworn before a 1st Class Magistrate, marriage card/certificate (for change of surname by women candidates), original Gazette notification, and a DD of Rs. 500 in favour of IGNOU payable at New Delhi. Requests are accepted only before the degree/diploma/certificate is awarded.",
  },
  {
    category: "Changes & Corrections",
    question: "Can I change some of the courses I selected?",
    answer: "Contact your Regional Centre for change of course, as per applicable rules and on payment of the requisite fee.",
  },
  // ---- Fee, refund, scholarships ----
  {
    category: "Fee, Refund & Scholarships",
    question: "In which cases can I get a fee refund?",
    answer:
      "(1) If your admission form is rejected, (2) if you applied for cancellation of admission within the stipulated time, or (3) if you paid the fee twice for the same control number / enrolment. Refunds follow IGNOU's Refund Policy (Common Prospectus point 10.11). If you received study material, the refund is made only after you return it in good condition to the RC or MPDD.",
  },
  {
    category: "Fee, Refund & Scholarships",
    question: "How will I receive a refund and how can I track it?",
    answer:
      "Refunds are made online only (not cash), to the same account used for payment — so pay from your own card/UPI, not a cyber café's. Track it with the Bank ARN / Bank Reference number; if it doesn't reflect, ask your bank's customer care to trace it with that number. For refund queries email feerefund_srd@ignou.ac.in.",
  },
  {
    category: "Fee, Refund & Scholarships",
    question: "Are scholarships available for IGNOU students?",
    answer:
      "Yes. IGNOU learners are eligible for Government of India scholarships — apply online on the National Scholarship Portal (https://scholarships.gov.in) if you meet the criteria. SC/ST/physically challenged students are eligible for the Post-Matric Scholarship. IGNOU also has a limited fee-waiver scheme for SC/ST students in notified programmes. Contact your Regional Centre for details.",
    link: "https://scholarships.gov.in",
  },
  // ---- Certificates ----
  {
    category: "Certificates & Credit Transfer",
    question: "How do I get a Migration Certificate?",
    answer:
      "Download the Migration Certificate format from the IGNOU website and send it to the Registrar, SRD, IGNOU, Maidan Garhi, New Delhi – 110068, with the required documents (degree, grade card) and a DD of Rs. 500.",
  },
  {
    category: "Certificates & Credit Transfer",
    question: "What is credit transfer and how do I apply?",
    answer:
      "Credit transfer lets you transfer credits earned earlier to your current programme. Submit the Internal Credit Transfer Form with the requisite fee to the Registrar, SRD, IGNOU, Maidan Garhi, New Delhi – 110068. There is no direct admission to the 2nd/3rd year — you join the 1st year and apply for credit transfer. Check status at https://studentservices.ignou.ac.in/Admission/Adm/enroll.htm",
    link: "http://www.ignou.ac.in/ignou/studentzone/download/InternalCreditTransferscheme",
  },
  // ---- Help ----
  {
    category: "Help & Grievances",
    question: "How do I lodge a complaint with IGNOU headquarters?",
    answer:
      "Use iGRAM, IGNOU's online grievance portal (http://igram.ignou.ac.in). You can also contact the Student Service Centre (SSC), IGNOU, Maidan Garhi, New Delhi – 110068, phone 011-29572514 / 29572513 (9:30 am – 6:00 pm, lunch 1:30–2:00 pm), email ssc@ignou.ac.in. For anything the study centre can help with, raise a query in this app first.",
    link: "http://igram.ignou.ac.in",
  },
  {
    category: "Help & Grievances",
    question: "My payment was deducted but not confirmed. What should I do?",
    answer:
      "Wait for some time, then use the “Status Query” button under “My Transactions” in your login. If it still isn't updated, email the transaction details (control number, name, programme, mobile, amount) to the Centralized Student Registration Cell at csrc@ignou.ac.in or call 011-29571301 / 011-29571528. You may escalate on iGRAM (http://igram.ignou.ac.in).",
  },
];
