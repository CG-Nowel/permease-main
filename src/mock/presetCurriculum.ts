export interface PresetSubject {
  code: string;
  title: string;
  units: number;
  type: 'Major' | 'General Education' | 'Elective' | 'Institutional';
}

export interface YearCurriculum {
  firstSem: PresetSubject[];
  secondSem: PresetSubject[];
}

export interface ProgramCurriculum {
  id: string;
  course: string;
  program: string;
  shortName: string;
  years: Record<string, YearCurriculum>;
}

export const presetCurriculums: ProgramCurriculum[] = [
  {
    id: 'bsit',
    course: 'BS',
    program: 'Information Technology',
    shortName: 'BSIT',
    years: {
      '1st Year': {
        firstSem: [
          { code: 'IT 101', title: 'Introduction to Computing', units: 3, type: 'Major' },
          { code: 'CC 101', title: 'Computer Programming 1 (Python)', units: 3, type: 'Major' },
          { code: 'MATH 101', title: 'Mathematics in the Modern World', units: 3, type: 'General Education' },
          { code: 'GE 101', title: 'Understanding the Self', units: 3, type: 'General Education' },
          { code: 'PE 101', title: 'Physical Education 1 (Fitness)', units: 2, type: 'Institutional' },
          { code: 'NSTP 101', title: 'National Service Training Program 1', units: 3, type: 'Institutional' },
        ],
        secondSem: [
          { code: 'CC 102', title: 'Computer Programming 2 (Java)', units: 3, type: 'Major' },
          { code: 'IT 102', title: 'Discrete Mathematics for IT', units: 3, type: 'Major' },
          { code: 'GE 102', title: 'Purposive Communication', units: 3, type: 'General Education' },
          { code: 'GE 103', title: 'The Contemporary World', units: 3, type: 'General Education' },
          { code: 'PE 102', title: 'Physical Education 2 (Rhythmic Activity)', units: 2, type: 'Institutional' },
          { code: 'NSTP 102', title: 'National Service Training Program 2', units: 3, type: 'Institutional' },
        ],
      },
      '2nd Year': {
        firstSem: [
          { code: 'IT 201', title: 'Data Structures & Algorithms', units: 3, type: 'Major' },
          { code: 'IT 202', title: 'Object-Oriented Programming', units: 3, type: 'Major' },
          { code: 'IT 203', title: 'Database Management Systems 1', units: 3, type: 'Major' },
          { code: 'GE 104', title: 'Art Appreciation', units: 3, type: 'General Education' },
          { code: 'GE 105', title: 'Ethics', units: 3, type: 'General Education' },
          { code: 'PE 103', title: 'Physical Education 3 (Individual Sports)', units: 2, type: 'Institutional' },
        ],
        secondSem: [
          { code: 'IT 204', title: 'Advanced Database Systems & SQL', units: 3, type: 'Major' },
          { code: 'IT 205', title: 'Web Systems & Technologies 1', units: 3, type: 'Major' },
          { code: 'IT 206', title: 'Networking 1 (Cisco Fundamentals)', units: 3, type: 'Major' },
          { code: 'IT 207', title: 'Quantitative Methods in Computing', units: 3, type: 'Major' },
          { code: 'GE 106', title: 'Readings in Philippine History', units: 3, type: 'General Education' },
          { code: 'PE 104', title: 'Physical Education 4 (Team Sports)', units: 2, type: 'Institutional' },
        ],
      },
      '3rd Year': {
        firstSem: [
          { code: 'IT 301', title: 'Information Assurance & Security 1', units: 3, type: 'Major' },
          { code: 'IT 302', title: 'Web Systems & Technologies 2 (Full-Stack)', units: 3, type: 'Major' },
          { code: 'IT 303', title: 'Networking 2 (Routing & Switching)', units: 3, type: 'Major' },
          { code: 'IT 304', title: 'Systems Analysis & Design', units: 3, type: 'Major' },
          { code: 'IT 305', title: 'Mobile Application Development', units: 3, type: 'Major' },
          { code: 'ELEC 1', title: 'IT Elective 1: Cloud Architecture', units: 3, type: 'Elective' },
        ],
        secondSem: [
          { code: 'IT 306', title: 'Information Assurance & Security 2', units: 3, type: 'Major' },
          { code: 'IT 307', title: 'Systems Integration & Architecture', units: 3, type: 'Major' },
          { code: 'IT 308', title: 'Capstone Project & Research 1', units: 3, type: 'Major' },
          { code: 'IT 309', title: 'Human-Computer Interaction (UI/UX)', units: 3, type: 'Major' },
          { code: 'ELEC 2', title: 'IT Elective 2: Cybersecurity & Forensics', units: 3, type: 'Elective' },
        ],
      },
      '4th Year': {
        firstSem: [
          { code: 'IT 401', title: 'Capstone Project & Research 2', units: 3, type: 'Major' },
          { code: 'IT 402', title: 'Social & Professional Issues in IT', units: 3, type: 'Major' },
          { code: 'ELEC 3', title: 'IT Elective 3: DevOps & Containerization', units: 3, type: 'Elective' },
          { code: 'ELEC 4', title: 'IT Elective 4: Big Data & Analytics', units: 3, type: 'Elective' },
        ],
        secondSem: [
          { code: 'IT 403', title: 'Practicum / On-The-Job Training (486 Hours)', units: 6, type: 'Major' },
          { code: 'IT 404', title: 'Industry Seminar & Professional Ethics', units: 3, type: 'Institutional' },
        ],
      },
    },
  },
  {
    id: 'bscs',
    course: 'BS',
    program: 'Computer Science',
    shortName: 'BSCS',
    years: {
      '1st Year': {
        firstSem: [
          { code: 'CS 101', title: 'Introduction to Computer Science', units: 3, type: 'Major' },
          { code: 'CC 101', title: 'Computer Programming 1 (Python)', units: 3, type: 'Major' },
          { code: 'MATH 111', title: 'Calculus 1 (Differential Calculus)', units: 3, type: 'Major' },
          { code: 'GE 101', title: 'Understanding the Self', units: 3, type: 'General Education' },
          { code: 'PE 101', title: 'Physical Education 1 (Fitness)', units: 2, type: 'Institutional' },
          { code: 'NSTP 101', title: 'National Service Training Program 1', units: 3, type: 'Institutional' },
        ],
        secondSem: [
          { code: 'CC 102', title: 'Computer Programming 2 (C++)', units: 3, type: 'Major' },
          { code: 'CS 102', title: 'Discrete Structures & Graph Theory', units: 3, type: 'Major' },
          { code: 'MATH 112', title: 'Calculus 2 (Integral Calculus)', units: 3, type: 'Major' },
          { code: 'GE 102', title: 'Purposive Communication', units: 3, type: 'General Education' },
          { code: 'PE 102', title: 'Physical Education 2', units: 2, type: 'Institutional' },
          { code: 'NSTP 102', title: 'National Service Training Program 2', units: 3, type: 'Institutional' },
        ],
      },
      '2nd Year': {
        firstSem: [
          { code: 'CS 201', title: 'Data Structures & Algorithms Analysis', units: 3, type: 'Major' },
          { code: 'CS 202', title: 'Object-Oriented Software Design', units: 3, type: 'Major' },
          { code: 'CS 203', title: 'Computer Architecture & Assembly', units: 3, type: 'Major' },
          { code: 'MATH 201', title: 'Linear Algebra for Computing', units: 3, type: 'Major' },
          { code: 'GE 104', title: 'Art Appreciation', units: 3, type: 'General Education' },
          { code: 'PE 103', title: 'Physical Education 3', units: 2, type: 'Institutional' },
        ],
        secondSem: [
          { code: 'CS 204', title: 'Design & Analysis of Algorithms', units: 3, type: 'Major' },
          { code: 'CS 205', title: 'Operating Systems & Concurrency', units: 3, type: 'Major' },
          { code: 'CS 206', title: 'Database Systems & Relational Theory', units: 3, type: 'Major' },
          { code: 'MATH 202', title: 'Probability & Statistical Computing', units: 3, type: 'Major' },
          { code: 'GE 105', title: 'Ethics', units: 3, type: 'General Education' },
          { code: 'PE 104', title: 'Physical Education 4', units: 2, type: 'Institutional' },
        ],
      },
      '3rd Year': {
        firstSem: [
          { code: 'CS 301', title: 'Automata & Formal Language Theory', units: 3, type: 'Major' },
          { code: 'CS 302', title: 'Software Engineering Principles', units: 3, type: 'Major' },
          { code: 'CS 303', title: 'Artificial Intelligence & Search', units: 3, type: 'Major' },
          { code: 'CS 304', title: 'Web Application Architecture', units: 3, type: 'Major' },
          { code: 'CS 305', title: 'Computer Networks & Security', units: 3, type: 'Major' },
        ],
        secondSem: [
          { code: 'CS 306', title: 'Compiler Design & Construction', units: 3, type: 'Major' },
          { code: 'CS 307', title: 'Software Engineering 2 (Agile Lab)', units: 3, type: 'Major' },
          { code: 'CS 308', title: 'Computer Science Thesis 1', units: 3, type: 'Major' },
          { code: 'ELEC 1', title: 'CS Elective 1: Machine Learning & NLP', units: 3, type: 'Elective' },
          { code: 'GE 106', title: 'Readings in Philippine History', units: 3, type: 'General Education' },
        ],
      },
      '4th Year': {
        firstSem: [
          { code: 'CS 401', title: 'Computer Science Thesis 2', units: 3, type: 'Major' },
          { code: 'CS 402', title: 'Information Security & Cryptography', units: 3, type: 'Major' },
          { code: 'ELEC 2', title: 'CS Elective 2: Deep Learning & Vision', units: 3, type: 'Elective' },
          { code: 'GE 107', title: 'Life and Works of Rizal', units: 3, type: 'General Education' },
        ],
        secondSem: [
          { code: 'CS 403', title: 'Computer Science Practicum / OJT (486 Hours)', units: 6, type: 'Major' },
          { code: 'CS 404', title: 'Colloquium & Emerging Technologies', units: 3, type: 'Institutional' },
        ],
      },
    },
  },
  {
    id: 'bscpe',
    course: 'BS',
    program: 'Computer Engineering',
    shortName: 'BSCpE',
    years: {
      '1st Year': {
        firstSem: [
          { code: 'CPE 101', title: 'Engineering Calculus 1', units: 3, type: 'Major' },
          { code: 'CC 101', title: 'Computer Programming 1', units: 3, type: 'Major' },
          { code: 'CHEM 101', title: 'Chemistry for Engineers', units: 3, type: 'Major' },
          { code: 'GE 101', title: 'Understanding the Self', units: 3, type: 'General Education' },
          { code: 'PE 101', title: 'Physical Education 1', units: 2, type: 'Institutional' },
          { code: 'NSTP 101', title: 'National Service Training Program 1', units: 3, type: 'Institutional' },
        ],
        secondSem: [
          { code: 'CPE 102', title: 'Engineering Calculus 2', units: 3, type: 'Major' },
          { code: 'PHYS 101', title: 'Physics for Engineers (Calculus-based)', units: 4, type: 'Major' },
          { code: 'CC 102', title: 'Computer Programming 2', units: 3, type: 'Major' },
          { code: 'GE 102', title: 'Purposive Communication', units: 3, type: 'General Education' },
          { code: 'PE 102', title: 'Physical Education 2', units: 2, type: 'Institutional' },
          { code: 'NSTP 102', title: 'National Service Training Program 2', units: 3, type: 'Institutional' },
        ],
      },
      '2nd Year': {
        firstSem: [
          { code: 'CPE 201', title: 'Circuits 1 (DC Circuits Analysis)', units: 3, type: 'Major' },
          { code: 'CPE 202', title: 'Discrete Mathematics', units: 3, type: 'Major' },
          { code: 'CPE 203', title: 'Data Structures & Algorithms', units: 3, type: 'Major' },
          { code: 'MATH 201', title: 'Differential Equations', units: 3, type: 'Major' },
          { code: 'GE 103', title: 'The Contemporary World', units: 3, type: 'General Education' },
          { code: 'PE 103', title: 'Physical Education 3', units: 2, type: 'Institutional' },
        ],
        secondSem: [
          { code: 'CPE 204', title: 'Circuits 2 (AC Circuits Analysis)', units: 3, type: 'Major' },
          { code: 'CPE 205', title: 'Electronic Devices & Circuits', units: 4, type: 'Major' },
          { code: 'CPE 206', title: 'Logic Circuits & Design', units: 3, type: 'Major' },
          { code: 'MATH 202', title: 'Engineering Probability & Statistics', units: 3, type: 'Major' },
          { code: 'GE 104', title: 'Art Appreciation', units: 3, type: 'General Education' },
          { code: 'PE 104', title: 'Physical Education 4', units: 2, type: 'Institutional' },
        ],
      },
      '3rd Year': {
        firstSem: [
          { code: 'CPE 301', title: 'Microprocessors & Microcontrollers', units: 4, type: 'Major' },
          { code: 'CPE 302', title: 'Computer Engineering Drafting & Design', units: 2, type: 'Major' },
          { code: 'CPE 303', title: 'Feedback & Control Systems', units: 3, type: 'Major' },
          { code: 'CPE 304', title: 'Computer Networks & Data Comms', units: 3, type: 'Major' },
          { code: 'CPE 305', title: 'Embedded Systems Design', units: 3, type: 'Major' },
        ],
        secondSem: [
          { code: 'CPE 306', title: 'Computer Architecture & Organization', units: 4, type: 'Major' },
          { code: 'CPE 307', title: 'Digital Signal Processing', units: 3, type: 'Major' },
          { code: 'CPE 308', title: 'CpE Methods of Research & Thesis 1', units: 2, type: 'Major' },
          { code: 'ELEC 1', title: 'CpE Elective 1: Robotics & IoT', units: 3, type: 'Elective' },
          { code: 'GE 105', title: 'Ethics', units: 3, type: 'General Education' },
        ],
      },
      '4th Year': {
        firstSem: [
          { code: 'CPE 401', title: 'CpE Design Project / Thesis 2', units: 2, type: 'Major' },
          { code: 'CPE 402', title: 'Emerging Technologies in CpE', units: 3, type: 'Major' },
          { code: 'ELEC 2', title: 'CpE Elective 2: VLSI Design', units: 3, type: 'Elective' },
          { code: 'GE 106', title: 'Readings in Philippine History', units: 3, type: 'General Education' },
        ],
        secondSem: [
          { code: 'CPE 403', title: 'CpE On-the-Job Training / Practicum (486 Hours)', units: 6, type: 'Major' },
          { code: 'CPE 404', title: 'Engineering Seminars & Colloquium', units: 2, type: 'Institutional' },
        ],
      },
    },
  },
  {
    id: 'bsba',
    course: 'BS',
    program: 'Business Administration',
    shortName: 'BSBA',
    years: {
      '1st Year': {
        firstSem: [
          { code: 'BA 101', title: 'Introduction to Business Management', units: 3, type: 'Major' },
          { code: 'BA 102', title: 'Financial Accounting 1', units: 3, type: 'Major' },
          { code: 'MATH 101', title: 'Business Mathematics', units: 3, type: 'General Education' },
          { code: 'GE 101', title: 'Understanding the Self', units: 3, type: 'General Education' },
          { code: 'PE 101', title: 'Physical Education 1', units: 2, type: 'Institutional' },
          { code: 'NSTP 101', title: 'National Service Training Program 1', units: 3, type: 'Institutional' },
        ],
        secondSem: [
          { code: 'BA 103', title: 'Microeconomics Theory', units: 3, type: 'Major' },
          { code: 'BA 104', title: 'Financial Accounting 2', units: 3, type: 'Major' },
          { code: 'BA 105', title: 'Principles of Marketing', units: 3, type: 'Major' },
          { code: 'GE 102', title: 'Purposive Communication', units: 3, type: 'General Education' },
          { code: 'PE 102', title: 'Physical Education 2', units: 2, type: 'Institutional' },
          { code: 'NSTP 102', title: 'National Service Training Program 2', units: 3, type: 'Institutional' },
        ],
      },
      '2nd Year': {
        firstSem: [
          { code: 'BA 201', title: 'Business Law (Obligations & Contracts)', units: 3, type: 'Major' },
          { code: 'BA 202', title: 'Human Resource Management', units: 3, type: 'Major' },
          { code: 'BA 203', title: 'Macroeconomic Principles', units: 3, type: 'Major' },
          { code: 'BA 204', title: 'Operations Management & TQM', units: 3, type: 'Major' },
          { code: 'GE 103', title: 'The Contemporary World', units: 3, type: 'General Education' },
          { code: 'PE 103', title: 'Physical Education 3', units: 2, type: 'Institutional' },
        ],
        secondSem: [
          { code: 'BA 205', title: 'Financial Management & Analysis', units: 3, type: 'Major' },
          { code: 'BA 206', title: 'Taxation (Income & Business Taxes)', units: 3, type: 'Major' },
          { code: 'BA 207', title: 'Business Research & Statistics', units: 3, type: 'Major' },
          { code: 'GE 104', title: 'Art Appreciation', units: 3, type: 'General Education' },
          { code: 'GE 105', title: 'Ethics', units: 3, type: 'General Education' },
          { code: 'PE 104', title: 'Physical Education 4', units: 2, type: 'Institutional' },
        ],
      },
      '3rd Year': {
        firstSem: [
          { code: 'BA 301', title: 'Strategic Management & Policy', units: 3, type: 'Major' },
          { code: 'BA 302', title: 'International Business & Trade', units: 3, type: 'Major' },
          { code: 'BA 303', title: 'Enterprise Resource Planning (ERP)', units: 3, type: 'Major' },
          { code: 'BA 304', title: 'Cost Accounting & Control', units: 3, type: 'Major' },
          { code: 'ELEC 1', title: 'BA Elective 1: Digital Marketing & E-Commerce', units: 3, type: 'Elective' },
        ],
        secondSem: [
          { code: 'BA 305', title: 'E-Business & Digital Commerce', units: 3, type: 'Major' },
          { code: 'BA 306', title: 'Corporate Governance & Social Responsibility', units: 3, type: 'Major' },
          { code: 'BA 307', title: 'Business Feasibility Study 1', units: 3, type: 'Major' },
          { code: 'ELEC 2', title: 'BA Elective 2: Supply Chain Management', units: 3, type: 'Elective' },
          { code: 'GE 106', title: 'Readings in Philippine History', units: 3, type: 'General Education' },
        ],
      },
      '4th Year': {
        firstSem: [
          { code: 'BUSS1024', title: 'Feasability Study', units: 3, type: 'Major' },
          { code: 'BUSS1025', title: 'Entrepreneural Management', units: 3, type: 'Major' },
          { code: 'BUSS1020', title: 'Financial Management', units: 3, type: 'Elective' },
          { code: 'BUSS1026', title: 'Marketing Management', units: 3, type: 'General Education' },
          { code: 'STIC1007', title: 'Euthenics 2', units: 1, type: 'Elective' },
          { code: 'BUSS1027', title: 'Special Topics in Operation Management', units: 3, type: 'General Education' },
        ],
        secondSem: [
          { code: 'OJTC1005', title: 'Practicum (600 hours)', units: 6, type: 'Major' },
        ],
      },
    },
  },
];
