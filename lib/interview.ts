const ROLE_OPTION_VALUES = [
  "Accountant",
  "Actor",
  "Actuary",
  "Acupuncturist",
  "Agricultural Inspector",
  "Agricultural Worker",
  "Agronomist",
  "Administrative Assistant",
  "Advertising Manager",
  "Aerospace Engineer",
  "Aircraft Mechanic",
  "Airline Pilot",
  "Air Traffic Controller",
  "Animal Caretaker",
  "Animal Control Officer",
  "Appliance Repair Technician",
  "Architect",
  "Archaeologist",
  "Archivist",
  "Art Director",
  "Assembler",
  "Athletic Trainer",
  "Audiologist",
  "Auto Body Technician",
  "Automotive Mechanic",
  "Bailiff",
  "Baker",
  "Bank Teller",
  "Barber",
  "Barista",
  "Bartender",
  "Biologist",
  "Biomedical Engineer",
  "Bookkeeper",
  "Brand Manager",
  "Bricklayer",
  "Budget Analyst",
  "Bus Driver",
  "Busser",
  "Business Analyst",
  "Business Development Manager",
  "Butcher",
  "Cabinetmaker",
  "Call Center Agent",
  "Carpenter",
  "Caregiver",
  "Cardiovascular Technologist",
  "Cashier",
  "Chef",
  "Chemical Engineer",
  "Childcare Worker",
  "Chiropractor",
  "Civil Engineer",
  "Claims Adjuster",
  "Cleaner",
  "Clinical Laboratory Technician",
  "CNC Machinist",
  "Coach",
  "Commercial Driver",
  "Community Health Worker",
  "Compliance Officer",
  "Computer Technician",
  "Concierge",
  "Conservation Scientist",
  "Construction Laborer",
  "Construction Manager",
  "Content Writer",
  "Copywriter",
  "Correctional Officer",
  "Cosmetologist",
  "Counselor",
  "Courier",
  "Crane Operator",
  "Credit Analyst",
  "Cybersecurity Analyst",
  "Data Entry Clerk",
  "Dental Assistant",
  "Dental Hygienist",
  "Dental Laboratory Technician",
  "Dentist",
  "Delivery Driver",
  "Detective",
  "Diesel Mechanic",
  "Dietitian",
  "Digital Marketing Specialist",
  "Dispatcher",
  "Doctor",
  "Drafter",
  "Drywall Installer",
  "Economist",
  "Editor",
  "Electrician",
  "Electrical Engineer",
  "Electronics Technician",
  "Elementary School Teacher",
  "Emergency Medical Technician",
  "Environmental Engineer",
  "Environmental Scientist",
  "Esthetician",
  "Event Planner",
  "Executive Assistant",
  "Facilities Manager",
  "Farmer",
  "Fashion Designer",
  "File Clerk",
  "Film Producer",
  "Financial Advisor",
  "Financial Analyst",
  "Firefighter",
  "Flight Attendant",
  "Food Service Worker",
  "Forklift Operator",
  "Forester",
  "Frontend Developer",
  "Frontend Engineer",
  "Funeral Director",
  "GIS Analyst",
  "Grant Writer",
  "Graphic Designer",
  "Guidance Counselor",
  "Hair Stylist",
  "Healthcare Assistant",
  "Heavy Equipment Operator",
  "Home Health Aide",
  "Hotel Manager",
  "Hotel Receptionist",
  "Housekeeper",
  "Human Resources Coordinator",
  "Human Resources Manager",
  "HVAC Technician",
  "Industrial Engineer",
  "Insurance Agent",
  "Interior Designer",
  "Interpreter",
  "Inventory Specialist",
  "IT Support Specialist",
  "Janitor",
  "Journalist",
  "Judge",
  "Kindergarten Teacher",
  "Kitchen Manager",
  "Lab Technician",
  "Landscaper",
  "Lawyer",
  "Legal Assistant",
  "Librarian",
  "Line Cook",
  "Loan Officer",
  "Locksmith",
  "Logistics Coordinator",
  "Mail Carrier",
  "Machine Operator",
  "Machinist",
  "Maintenance Technician",
  "Management Consultant",
  "Manufacturing Technician",
  "Market Research Analyst",
  "Marketing Coordinator",
  "Marketing Manager",
  "Massage Therapist",
  "Mason",
  "Mechanic",
  "Mechanical Engineer",
  "Medical Assistant",
  "Medical Billing Specialist",
  "Medical Doctor",
  "Medical Receptionist",
  "Medical Records Technician",
  "Medical Sales Representative",
  "Mental Health Counselor",
  "Merchandiser",
  "Military Officer",
  "Mortgage Broker",
  "Music Teacher",
  "Musician",
  "Network Administrator",
  "Nurse",
  "Nursing Assistant",
  "Occupational Health and Safety Specialist",
  "Occupational Therapist",
  "Office Manager",
  "Operations Manager",
  "Optician",
  "Optometrist",
  "Painter",
  "Paralegal",
  "Paramedic",
  "Park Ranger",
  "Payroll Specialist",
  "Pest Control Technician",
  "Personal Trainer",
  "Pharmacist",
  "Pharmacy Technician",
  "Phlebotomist",
  "Photographer",
  "Physical Therapist",
  "Physician",
  "Physician Assistant",
  "Plumber",
  "Police Dispatcher",
  "Police Officer",
  "Police Sergeant",
  "Political Scientist",
  "Probation Officer",
  "Procurement Specialist",
  "Preschool Teacher",
  "Product Manager",
  "Production Supervisor",
  "Professor",
  "Project Coordinator",
  "Project Manager",
  "Property Manager",
  "Psychologist",
  "Public Relations Specialist",
  "Public Health Specialist",
  "Purchasing Agent",
  "QA Engineer",
  "Quality Assurance Inspector",
  "Radiologic Technologist",
  "Real Estate Agent",
  "Real Estate Appraiser",
  "Receptionist",
  "Records Clerk",
  "Recruiter",
  "Registered Nurse",
  "Respiratory Therapist",
  "Restaurant Manager",
  "Retail Sales Associate",
  "Retail Store Manager",
  "Roofer",
  "Safety Manager",
  "Sales Manager",
  "Sales Representative",
  "School Counselor",
  "School Principal",
  "Scrum Master",
  "Security Guard",
  "Server",
  "Sheet Metal Worker",
  "Sheriff Deputy",
  "Social Media Manager",
  "Social Worker",
  "Software Engineer",
  "Soldier",
  "Sonographer",
  "Special Education Teacher",
  "Speech-Language Pathologist",
  "Statistician",
  "Store Manager",
  "Substance Abuse Counselor",
  "Supply Chain Analyst",
  "Surgical Technologist",
  "Systems Administrator",
  "Tax Preparer",
  "Taxi Driver",
  "Teacher",
  "Technical Writer",
  "Telecommunications Technician",
  "Truck Driver",
  "Tutor",
  "Translator",
  "Travel Agent",
  "UI Designer",
  "Urban Planner",
  "UX Designer",
  "Veterinarian",
  "Veterinary Assistant",
  "Video Editor",
  "Warehouse Associate",
  "Water Treatment Operator",
  "Web Developer",
  "Welder",
  "Writer",
  "X-Ray Technician",
  "Youth Worker",
  "Zoologist",
  "Customer Service Representative",
  "Backend Developer",
  "Data Analyst",
  "Data Scientist",
  "DevOps Engineer",
  "Full Stack Developer",
  "Junior Java Developer",
  "Junior Python Developer",
  "Junior React Developer",
  "Machine Learning Engineer",
  "Mobile Developer",
  "Node.js Developer",
  "UI/UX Developer",
];

export const ROLE_OPTIONS = Array.from(new Set(ROLE_OPTION_VALUES)).sort(
  (firstRole, secondRole) => firstRole.localeCompare(secondRole)
);

export const FEATURED_ROLE_OPTIONS = [
  "Customer Service Representative",
  "Police Officer",
  "Automotive Mechanic",
  "Nurse",
  "Sales Representative",
  "Software Engineer",
];
export const MAX_ROLE_LENGTH = 120;
export const MAX_ANSWER_LENGTH = 4000;
export const MAX_HISTORY_MESSAGES = 24;
export const MAX_HISTORY_MESSAGE_LENGTH = 6000;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type InterviewState = {
  status?: string;
  question_number?: number;
  difficulty?: string;
  candidate_level_estimate?: string;
  topic?: string;
};

export type InterviewEvaluation = {
  score?: number | null;
  correctness?: string;
  clarity?: string;
  depth?: string;
};

export type InterviewResponse = {
  interview_state?: InterviewState;
  interview_meta?: InterviewState;
  question?: string;
  what_im_looking_for?: string[];
  evaluation?: InterviewEvaluation;
  feedback?: string;
  follow_up?: string;
  ideal_answer?: string;
  next_action?: string;
  current_question?: {
    question_text?: string;
    focus_areas?: string[];
  };
  last_review?: {
    reviewed_question_text?: string;
    evaluation?: InterviewEvaluation;
    feedback?: string;
    follow_up?: string;
    strong_answer_example?: string;
  } | null;
  [key: string]: unknown;
};

export type VisibleEvaluation = {
  score: string | null;
  correctness: string | null;
  clarity: string | null;
  depth: string | null;
};

export type CurrentQuestionState = {
  questionText: string | null;
  questionNumber: number | null;
  topic: string | null;
  difficulty: string | null;
  focusAreas: string[];
};

export type LastReviewState = {
  reviewedQuestionText: string | null;
  reviewedQuestionNumber: number | null;
  submittedAnswer: string;
  evaluation: VisibleEvaluation | null;
  feedback: string | null;
  followUp: string | null;
  strongAnswerExample: string | null;
};

export type SplitInterviewTurnResult = {
  interviewMeta: InterviewState | undefined;
  currentQuestionState: CurrentQuestionState;
  lastReviewState: LastReviewState | null;
  plainTextResponse: string | null;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getMeaningfulText(
  value: unknown,
  blockedValues: string[] = []
) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  return blockedValues.includes(text) ? null : text;
}

export function serializeAssistantResponse(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function parseInterviewResponse(value: unknown) {
  return isRecord(value) ? (value as InterviewResponse) : null;
}

export function getCurrentQuestionText(response: InterviewResponse | null) {
  const nestedQuestion = isRecord(response?.current_question)
    ? response.current_question
    : null;

  return getMeaningfulText(nestedQuestion?.question_text ?? response?.question);
}

export function hasRenderableCurrentQuestion(value: unknown) {
  return Boolean(getCurrentQuestionText(parseInterviewResponse(value)));
}

export function getVisibleEvaluation(
  response: InterviewResponse | null
): VisibleEvaluation | null {
  if (!response || !isRecord(response.evaluation)) {
    return null;
  }

  const evaluation = response.evaluation as InterviewEvaluation;
  const score =
    typeof evaluation.score === "number" ? String(evaluation.score) : null;
  const correctness = getMeaningfulText(evaluation.correctness, ["N/A"]);
  const clarity = getMeaningfulText(evaluation.clarity, ["N/A"]);
  const depth = getMeaningfulText(evaluation.depth, ["N/A"]);

  if (!score && !correctness && !clarity && !depth) {
    return null;
  }

  return {
    score,
    correctness,
    clarity,
    depth,
  };
}

function getFocusAreas(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    : [];
}

function getInterviewMeta(response: InterviewResponse | null) {
  return response?.interview_meta ?? response?.interview_state;
}

function getCurrentQuestionState(
  response: InterviewResponse | null
): CurrentQuestionState {
  const meta = getInterviewMeta(response);
  const nestedQuestion = isRecord(response?.current_question)
    ? response.current_question
    : null;

  return {
    questionText: getCurrentQuestionText(response),
    questionNumber:
      typeof meta?.question_number === "number" ? meta.question_number : null,
    topic: getMeaningfulText(meta?.topic),
    difficulty: getMeaningfulText(meta?.difficulty),
    focusAreas: getFocusAreas(
      nestedQuestion?.focus_areas ?? response?.what_im_looking_for
    ),
  };
}

function getLastReviewState({
  response,
  previousQuestionState,
  submittedAnswer,
}: {
  response: InterviewResponse | null;
  previousQuestionState: CurrentQuestionState | null;
  submittedAnswer: string | null;
}): LastReviewState | null {
  if (!submittedAnswer) {
    return null;
  }

  const nestedReview = isRecord(response?.last_review) ? response.last_review : null;
  const evaluation = getVisibleEvaluation(
    nestedReview
      ? {
          evaluation: nestedReview.evaluation,
        }
      : response
  );
  const feedback = getMeaningfulText(
    nestedReview?.feedback ?? response?.feedback,
    ["N/A"]
  );
  const followUp = getMeaningfulText(
    nestedReview?.follow_up ?? response?.follow_up,
    ["NONE", "N/A"]
  );
  const strongAnswerExample = getMeaningfulText(
    nestedReview?.strong_answer_example,
    ["N/A"]
  );

  if (!evaluation && !feedback && !followUp && !strongAnswerExample) {
    return null;
  }

  return {
    reviewedQuestionText:
      getMeaningfulText(nestedReview?.reviewed_question_text) ??
      previousQuestionState?.questionText ??
      null,
    reviewedQuestionNumber: previousQuestionState?.questionNumber ?? null,
    submittedAnswer,
    evaluation,
    feedback,
    followUp,
    strongAnswerExample,
  };
}

export function splitInterviewTurn({
  payload,
  previousQuestionState,
  submittedAnswer,
}: {
  payload: unknown;
  previousQuestionState: CurrentQuestionState | null;
  submittedAnswer: string | null;
}): SplitInterviewTurnResult {
  const response = parseInterviewResponse(payload);

  if (!response) {
    return {
      interviewMeta: undefined,
      currentQuestionState:
        previousQuestionState ?? {
          questionText: null,
          questionNumber: null,
          topic: null,
          difficulty: null,
          focusAreas: [],
        },
      lastReviewState: null,
      plainTextResponse: typeof payload === "string" ? payload : null,
    };
  }

  const nextQuestionState = getCurrentQuestionState(response);

  return {
    interviewMeta: getInterviewMeta(response),
    currentQuestionState:
      !nextQuestionState.questionText && previousQuestionState
        ? previousQuestionState
        : nextQuestionState,
    lastReviewState: getLastReviewState({
      response,
      previousQuestionState,
      submittedAnswer,
    }),
    plainTextResponse: typeof payload === "string" ? payload : null,
  };
}
