require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Project = require('./models/Project');
const Discussion = require('./models/Discussion');
const Applicant = require('./models/Applicant');
const Interest = require('./models/Interest');
const Notification = require('./models/Notification');

const sampleUsersData = [
  {
    name: 'Suruthi Sagar',
    email: 'suruthisagar@student.tce.edu',
    regNo: '22IT099',
    passkey: '123',
    phone: '9876543210',
    role: 'student',
    department: 'Information Technology',
    year: '3rd Year',
    section: 'Section A',
    bio: 'Full-stack web developer & cloud technology learner.',
    skills: [
      { id: 's1', name: 'React', status: 'verified' },
      { id: 's2', name: 'Node.js', status: 'verified' },
      { id: 's3', name: 'MongoDB', status: 'verified' },
      { id: 's4', name: 'JavaScript', status: 'verified' }
    ]
  },
  {
    name: 'Ansila A',
    email: 'ansila@student.tce.edu',
    regNo: '22IT012',
    passkey: '456',
    phone: '9876543211',
    role: 'student',
    department: 'Information Technology',
    year: '3rd Year',
    section: 'Section A',
    bio: 'UI/UX designer and frontend specialist.',
    skills: [
      { id: 's5', name: 'Figma', status: 'verified' },
      { id: 's6', name: 'CSS3', status: 'verified' },
      { id: 's7', name: 'React', status: 'verified' },
      { id: 's8', name: 'HTML5', status: 'verified' }
    ]
  },
  {
    name: 'Sanjaypriyan S',
    email: 'sanjay@student.tce.edu',
    regNo: '22IT085',
    passkey: '789',
    phone: '9876543212',
    role: 'student',
    department: 'Information Technology',
    year: '3rd Year',
    section: 'Section B',
    bio: 'Backend architect, Python enthusiast, and DevOps practitioner.',
    skills: [
      { id: 's9', name: 'Python', status: 'verified' },
      { id: 's10', name: 'Docker', status: 'verified' },
      { id: 's11', name: 'Node.js', status: 'verified' },
      { id: 's12', name: 'MongoDB', status: 'verified' }
    ]
  },
  {
    name: 'Jambu Omayan U R',
    email: 'jambu@student.tce.edu',
    regNo: '22IT045',
    passkey: '101',
    phone: '9876543213',
    role: 'student',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    section: 'Section A',
    bio: 'Mobile app developer and Flutter building enthusiast.',
    skills: [
      { id: 's13', name: 'Flutter', status: 'verified' },
      { id: 's14', name: 'Dart', status: 'verified' },
      { id: 's15', name: 'Firebase', status: 'verified' },
      { id: 's16', name: 'REST API', status: 'verified' }
    ]
  },
  {
    name: 'Test Student User',
    email: 'testuser@student.tce.edu',
    regNo: '22IT100',
    passkey: '102',
    phone: '9876543214',
    role: 'student',
    department: 'Information Technology',
    year: '3rd Year',
    section: 'Section A',
    bio: 'Web tech learner and passionate team collaborator.',
    skills: [
      { id: 's17', name: 'JavaScript', status: 'verified' },
      { id: 's18', name: 'HTML5', status: 'verified' },
      { id: 's19', name: 'CSS3', status: 'verified' },
      { id: 's20', name: 'React', status: 'verified' },
      { id: 's21', name: 'Node.js', status: 'verified' },
      { id: 's22', name: 'MongoDB', status: 'verified' }
    ]
  }
];

const seedDatabase = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB');
    process.exit(1);
  }

  try {
    console.log('Seeding database with updated user data, project deadlines, and application statuses...');

    // 1. Delete notifications created before Oct 7, 2026
    const oct7Date = new Date('2026-10-07T00:00:00.000Z');
    const deleteNotifResult = await Notification.deleteMany({ createdAt: { $lt: oct7Date } });
    console.log(`Cleaned up ${deleteNotifResult.deletedCount || 0} notifications created before Oct 7, 2026.`);

    // 2. Ensure students exist with verified skills
    const defaultPasswordHash = await User.hashPassword('Suruthisagar_2007');
    const createdUsers = {};
    for (const userData of sampleUsersData) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.createWithPasswordHash({
          ...userData,
          passwordHash: defaultPasswordHash,
          isActive: true
        });
      } else {
        user.password = defaultPasswordHash;
        user.skills = userData.skills;
        user.bio = userData.bio;
        user.department = userData.department;
        user.year = userData.year;
        user.passkey = userData.passkey;
        await user.save();
      }
      createdUsers[user.email] = user;
    }

    const suruthi = createdUsers['suruthisagar@student.tce.edu'];
    const ansila = createdUsers['ansila@student.tce.edu'];
    const sanjay = createdUsers['sanjay@student.tce.edu'];
    const jambu = createdUsers['jambu@student.tce.edu'];
    const testuser = createdUsers['testuser@student.tce.edu'];

    // 3. Clear & Seed Projects for each user with clear DATE deadlines
    await Project.deleteMany({});

    const projectsData = [
      {
        title: 'Smart Campus Food Waste Monitoring System',
        description: 'IoT and web dashboard for real-time food waste analytics across TCE messes.',
        type: 'Web Application',
        department: 'Information Technology',
        year: '3rd Year',
        status: 'open',
        deadline: new Date('2026-10-25T23:59:59.000Z'),
        requiredSkills: ['Node.js', 'MongoDB', 'React'],
        teamSize: 5,
        createdBy: suruthi._id
      },
      {
        title: 'AI Automated Resume & Portfolio Matcher',
        description: 'NLP-driven tool for matching TCE student skills with project and internship roles.',
        type: 'AI / Machine Learning',
        department: 'Information Technology',
        year: '3rd Year',
        status: 'open',
        deadline: new Date('2026-11-05T23:59:59.000Z'),
        requiredSkills: ['Python', 'Docker', 'MongoDB'],
        teamSize: 4,
        createdBy: sanjay._id
      },
      {
        title: 'TCE Mobile Navigation & Event Companion',
        description: 'Flutter mobile application providing interactive campus navigation and live event feeds.',
        type: 'Mobile App',
        department: 'Computer Science & Engineering',
        year: '3rd Year',
        status: 'open',
        deadline: new Date('2026-11-12T23:59:59.000Z'),
        requiredSkills: ['Flutter', 'Firebase', 'Dart'],
        teamSize: 4,
        createdBy: jambu._id
      },
      {
        title: 'Student Design System & Component Library',
        description: 'Figma design system and React component framework tailored for TCE lab projects.',
        type: 'UI/UX & Design',
        department: 'Information Technology',
        year: '3rd Year',
        status: 'open',
        deadline: new Date('2026-10-30T23:59:59.000Z'),
        requiredSkills: ['Figma', 'CSS3', 'React'],
        teamSize: 3,
        createdBy: ansila._id
      },
      {
        title: 'Decentralized Academic Certificate Verifier',
        description: 'Web3 portal using Ethereum smart contracts for instant verification of student credentials.',
        type: 'Blockchain',
        department: 'Information Technology',
        year: '3rd Year',
        status: 'open',
        deadline: new Date('2026-11-20T23:59:59.000Z'),
        requiredSkills: ['JavaScript', 'React', 'HTML5'],
        teamSize: 4,
        createdBy: testuser._id
      }
    ];

    const insertedProjects = await Project.insertMany(projectsData);
    console.log(`Inserted ${insertedProjects.length} project postings with exact date deadlines.`);

    // 4. Clear & Seed Applications and Interests with Pending, Accepted, and Rejected statuses
    await Applicant.deleteMany({});
    await Interest.deleteMany({});

    const projectFoodWaste = insertedProjects.find((p) => p.title.includes('Food Waste'));
    const projectDesign = insertedProjects.find((p) => p.title.includes('Design System'));

    // On Suruthi's Food Waste project:
    // a) Ansila: Pending (Not accepted already - owner can Accept or Reject)
    if (projectFoodWaste && ansila) {
      await Applicant.create({
        user: ansila._id,
        project: projectFoodWaste._id,
        name: ansila.name,
        regNo: ansila.regNo,
        department: ansila.department,
        year: ansila.year,
        skills: ['React', 'CSS3', 'Figma', 'Node.js', 'MongoDB'],
        matchScore: 100,
        status: 'pending'
      });
      await Interest.create({
        user: ansila._id,
        project: projectFoodWaste._id,
        title: projectFoodWaste.title,
        details: 'I have designed the frontend mockups in Figma and want to integrate the React views with Node.js.',
        status: 'pending'
      });
      await Notification.create({
        user: suruthi._id,
        title: 'New project application',
        message: `${ansila.name} expressed interest in your project ${projectFoodWaste.title}.`,
        type: 'interest',
        relatedProject: projectFoodWaste._id,
        relatedUser: ansila._id,
        createdAt: new Date('2026-10-08T10:00:00.000Z')
      });
    }

    // b) Sanjay: Accepted (Part of accepted current team)
    if (projectFoodWaste && sanjay) {
      await Applicant.create({
        user: sanjay._id,
        project: projectFoodWaste._id,
        name: sanjay.name,
        regNo: sanjay.regNo,
        department: sanjay.department,
        year: sanjay.year,
        skills: ['Node.js', 'MongoDB', 'Python', 'React'],
        matchScore: 100,
        status: 'accepted'
      });
      await Interest.create({
        user: sanjay._id,
        project: projectFoodWaste._id,
        title: projectFoodWaste.title,
        details: 'Setting up Express REST endpoints and Mongoose schemas.',
        status: 'accepted'
      });
    }

    // c) Jambu: Rejected (Owner can Reconsider!)
    if (projectFoodWaste && jambu) {
      await Applicant.create({
        user: jambu._id,
        project: projectFoodWaste._id,
        name: jambu.name,
        regNo: jambu.regNo,
        department: jambu.department,
        year: jambu.year,
        skills: ['Node.js', 'MongoDB', 'React', 'Flutter'],
        matchScore: 100,
        status: 'rejected'
      });
      await Interest.create({
        user: jambu._id,
        project: projectFoodWaste._id,
        title: projectFoodWaste.title,
        details: 'Offered to build a mobile Flutter client for campus mess wardens.',
        status: 'rejected'
      });
    }

    // d) Suruthi applies to Ansila's Design System project
    if (projectDesign && suruthi) {
      await Applicant.create({
        user: suruthi._id,
        project: projectDesign._id,
        name: suruthi.name,
        regNo: suruthi.regNo,
        department: suruthi.department,
        year: suruthi.year,
        skills: ['React', 'CSS3', 'Figma'],
        matchScore: 100,
        status: 'accepted'
      });
      await Interest.create({
        user: suruthi._id,
        project: projectDesign._id,
        title: projectDesign.title,
        details: 'I can help turn the Figma components into production-ready React modules.',
        status: 'accepted'
      });
    }

    // 5. Clear & Seed Forum Discussions in natural, dynamic student writing style
    await Discussion.deleteMany({});

    const disc1Id = new mongoose.Types.ObjectId();
    const comment1Id = new mongoose.Types.ObjectId();
    const comment2Id = new mongoose.Types.ObjectId();
    const subComment1Id = new mongoose.Types.ObjectId();

    const disc2Id = new mongoose.Types.ObjectId();
    const disc2Comment1Id = new mongoose.Types.ObjectId();

    const discussionsData = [
      {
        _id: disc1Id,
        tag: 'Tech Discussion',
        author: 'Suruthi Sagar',
        user: suruthi._id,
        title: 'Best practices for structuring Mongoose models in Semester 5 Web Tech',
        body: 'Hey everyone! Working on our web tech portal lab project. Does anyone have recommendations on schema options, validation rules, and indexes in Mongoose?',
        upvotes: 5,
        downvotes: 0,
        voters: [
          { user: ansila._id, vote: 1 },
          { user: sanjay._id, vote: 1 },
          { user: jambu._id, vote: 1 }
        ],
        comments: [
          {
            _id: comment1Id,
            user: sanjay._id,
            author: 'Sanjaypriyan S',
            text: 'I recommend setting `{ timestamps: true }` in your Mongoose schema options and using `select: false` on sensitive fields like passwords!',
            parentId: null,
            upvotes: 3,
            downvotes: 0,
            voters: [{ user: suruthi._id, vote: 1 }, { user: ansila._id, vote: 1 }],
            createdAt: new Date(Date.now() - 3600000)
          },
          {
            _id: subComment1Id,
            user: suruthi._id,
            author: 'Suruthi Sagar',
            text: 'That makes sense! Do you also recommend adding unique index on email at the schema level?',
            parentId: comment1Id,
            upvotes: 2,
            downvotes: 0,
            voters: [{ user: sanjay._id, vote: 1 }],
            createdAt: new Date(Date.now() - 1800000)
          },
          {
            _id: comment2Id,
            user: ansila._id,
            author: 'Ansila A',
            text: 'Also make sure to handle validation errors cleanly in your Express error handlers so the frontend receives human-readable messages.',
            parentId: null,
            upvotes: 4,
            downvotes: 0,
            voters: [{ user: suruthi._id, vote: 1 }],
            createdAt: new Date(Date.now() - 2500000)
          }
        ],
        replies: 3,
        timeLabel: '2 hours ago'
      },
      {
        _id: disc2Id,
        tag: 'Team Up',
        author: 'Ansila A',
        user: ansila._id,
        title: 'Looking for 1 backend developer skilled in Node.js for TCE Hackathon!',
        body: 'Our team already has UI/UX in Figma and React frontend set up. We need one teammate with Express & MongoDB expertise to join us for the hackathon this weekend!',
        upvotes: 8,
        downvotes: 0,
        voters: [
          { user: suruthi._id, vote: 1 },
          { user: sanjay._id, vote: 1 }
        ],
        comments: [
          {
            _id: disc2Comment1Id,
            user: jambu._id,
            author: 'Jambu Omayan U R',
            text: 'Interested! I have experience building REST APIs with Express and MongoDB.',
            parentId: null,
            upvotes: 2,
            downvotes: 0,
            voters: [{ user: ansila._id, vote: 1 }],
            createdAt: new Date(Date.now() - 72000000)
          }
        ],
        replies: 1,
        timeLabel: '1 day ago'
      },
      {
        tag: 'Project Idea',
        author: 'Sanjaypriyan S',
        user: sanjay._id,
        title: 'Tips on deploying Docker containers with MongoDB Atlas for local testing',
        body: 'Put together a quick reference guide for setting up dev environment variables and containerized servers. Let me know if you run into CORS issues with Live Server!',
        upvotes: 4,
        downvotes: 0,
        voters: [{ user: suruthi._id, vote: 1 }],
        comments: [],
        replies: 0,
        timeLabel: '2 days ago'
      },
      {
        tag: 'Q&A',
        author: 'Jambu Omayan U R',
        user: jambu._id,
        title: 'How do you handle JWT authentication persistence in mobile clients?',
        body: 'Hey guys, when connecting Flutter to Node REST APIs, what is the cleanest approach for storing JWT tokens securely across sessions?',
        upvotes: 3,
        downvotes: 0,
        voters: [{ user: ansila._id, vote: 1 }],
        comments: [],
        replies: 0,
        timeLabel: '3 days ago'
      }
    ];

    await Discussion.insertMany(discussionsData);
    console.log('Inserted dynamic student forum discussions with nested comments.');

    console.log('Database re-seeding completed cleanly!');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();