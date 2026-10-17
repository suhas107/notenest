// Fills the database with a demo account and realistic notes.
// Run with: npm run seed   (safe to re-run: it resets only the demo user's notes)
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Note = require('./models/Note');

const DEMO = { name: 'Demo Student', email: 'demo@notenest.app', password: 'demo123' };

// [title, content, tags, pinned, daysAgo]
const NOTES = [
  ['Mini project evaluation checklist', 'Live link working\nTake screenshots of every screen as backup\nRun npm test before the demo (23 tests)\nOpen noteController.js in VS Code\nDo NOT open .env on the projector\nPractise the 5 minute demo twice', ['college', 'fullstack', 'todo'], true, 0],
  ['Quiz 1 - JSON & REST cheat sheet', 'JSON: double quotes only, no trailing commas, no comments.\n6 types: string, number, boolean, object, array, null.\nJSON.parse = text -> object, JSON.stringify = object -> text.\n\nREST: GET read, POST create (201), PUT full update, PATCH partial, DELETE.\n400 bad input, 401 no token, 404 not found, 500 server error.', ['exams', 'fullstack'], true, 1],
  ['Quiz 2 - MongoDB & Mongoose', 'Table = collection, row = document, column = field.\nDefault port 27017. _id is an ObjectId.\nupdateOne(filter, { $set: {...} })\nMongoose = ODM on top of the native driver.\ntimestamps: true -> createdAt + updatedAt\nunique is an index, NOT a validator.', ['exams', 'fullstack'], true, 1],
  ['Placement prep plan - October', 'Mon/Wed/Fri: 2 LeetCode mediums (arrays, sliding window, graphs)\nTue/Thu: one system design topic\nSat: mock interview with Rahul\nSun: revise DBMS + OS notes\n\nTarget: 60 problems by end of month', ['placements', 'todo'], true, 3],
  ['DBMS - normalization summary', '1NF: atomic values, no repeating groups\n2NF: 1NF + no partial dependency on a composite key\n3NF: 2NF + no transitive dependency\nBCNF: every determinant is a candidate key\n\nPrevious year question: decompose R(A,B,C,D) with A->B, B->C', ['college', 'exams'], false, 4],
  ['Express middleware order', 'Order matters!\n1. cors()\n2. express.json()\n3. routes (router.use(protect) for private ones)\n4. 404 handler\n5. error handler LAST (4 args: err, req, res, next)\n\n/tags route must be above /:id or "tags" is treated as an id.', ['fullstack'], false, 5],
  ['Things to ask in the viva', 'How does JWT work, is it encrypted? (signed, not encrypted)\nWhy hash passwords? bcrypt + salt\nHow do you stop users seeing others notes? filter by user id\nPUT vs PATCH\nWhat is middleware\nHow is it deployed (Vercel serverless + Atlas)', ['college', 'fullstack'], false, 2],
  ['Startup idea: canteen pre-order app', 'Students order from the canteen app before the break ends, pay with UPI, pick up with a token number.\n\nMVP: menu, cart, order status, admin screen for canteen staff.\nStack: MERN + Razorpay test mode.\nTalk to the canteen manager first.', ['ideas'], false, 9],
  ['Idea: shared notes for study groups', 'Let one user share a note with classmates by email. Needs a "sharedWith" array of user ids in the Note schema, and the find query becomes { $or: [{ user: me }, { sharedWith: me }] }.', ['ideas', 'fullstack'], false, 6],
  ['Books to read this semester', 'Clean Code - Robert C. Martin (half done)\nThe Pragmatic Programmer\nAtomic Habits\nDesigning Data-Intensive Applications (chapters 1-3)\nZero to One', ['reading', 'personal'], false, 20],
  ['Notes from "Atomic Habits"', 'Make it obvious, attractive, easy, satisfying.\nHabit stacking: after I finish dinner, I will solve one LeetCode problem.\n1% better every day = 37x better in a year.\nIdentity first: "I am someone who codes daily".', ['reading'], false, 18],
  ['Gym routine - push / pull / legs', 'Push: bench 4x8, overhead press 3x10, dips 3x12\nPull: deadlift 3x5, pull-ups 4x8, rows 3x10\nLegs: squats 4x8, lunges 3x12, calf raises 4x15\n\nRest day Sunday. Protein target 110g.', ['fitness', 'personal'], false, 14],
  ['Morning run log', 'Week 1: 3 km, 19:40\nWeek 2: 3.5 km, 22:10\nWeek 3: 4 km, 25:05\nWeek 4: 5 km, 31:30  <- first 5k!\n\nNext goal: 5k under 30 minutes.', ['fitness'], false, 10],
  ['Monthly budget - October', 'Hostel mess: 4,200\nMobile + internet: 450\nTravel home: 1,100\nBooks/printouts: 300\nEating out: 1,500 (cut this down)\nSavings target: 2,000\n\nSIP of 1,000 on the 5th.', ['finance', 'personal'], false, 15],
  ['Things to buy', 'USB-C hub\nNew earphones\nA4 sheets for record\nWhiteboard markers\nCoffee', ['personal', 'todo'], false, 3],
  ['Goa trip with the gang - December', 'Dates: 22 to 26 Dec\nTrain: book on the 120-day opening\nStay: hostel near Anjuna, ~800 per night\nBudget: 8,000 each\nPlaces: Fort Aguada, Dudhsagar falls, Palolem beach', ['travel', 'personal'], false, 12],
  ['Packing list', 'Charger + power bank\nID card + college ID\nSunscreen\n2 days extra clothes\nMedicines\nEarphones', ['travel', 'todo'], false, 11],
  ['Maggi masala upgrade', 'Butter, onions, tomato, green chilli, a pinch of garam masala, then the noodles. Finish with cheese and coriander. 7 minutes.', ['recipes'], false, 25],
  ['Overnight oats', '1/2 cup oats, 1/2 cup milk, 2 spoons curd, 1 spoon honey, chia seeds, banana. Keep in the fridge overnight.', ['recipes', 'fitness'], false, 22],
  ['Internship standup notes', 'Yesterday: fixed the pagination bug in the orders API\nToday: write tests for the refund endpoint\nBlocker: need staging DB access from Priya\n\nRemember: PR descriptions need screenshots.', ['work'], false, 7],
  ['Code review feedback', 'Use async/await instead of .then chains\nNever trust req.body - validate on the server\nMove secrets to .env\nReturn 404 instead of 200 with null\nSmaller commits with clear messages', ['work', 'fullstack'], false, 8],
  ['OS - deadlock conditions', 'All 4 must hold:\n1. Mutual exclusion\n2. Hold and wait\n3. No preemption\n4. Circular wait\n\nBanker\'s algorithm avoids deadlock. Practise the safe-sequence problem.', ['college', 'exams'], false, 16],
  ['Computer networks - important topics', 'TCP vs UDP\n3-way handshake\nSubnetting (practise /26, /27)\nHTTP status codes\nDNS resolution steps\nOSI vs TCP/IP layers', ['college', 'exams'], false, 17],
  ['React hooks quick reference', 'useState - data that re-renders when changed\nuseEffect - side effects, runs after render; deps array controls when\nuseContext - read shared data (our AuthContext)\nuseCallback - keep the same function between renders\nuseParams / useNavigate / useSearchParams - React Router', ['fullstack'], false, 6],
  ['MongoDB aggregation example', 'Tag counts in NoteNest:\n$match { user }\n$unwind "$tags"\n$group { _id: "$tags", count: { $sum: 1 } }\n$sort { count: -1 }\n\nThis powers the tag list in the sidebar.', ['fullstack', 'exams'], false, 0],
  ['Resume updates', 'Add NoteNest (MERN, JWT, Vercel) with the live link\nMention 23 automated API tests\nMove the hackathon to the top\nKeep it to one page', ['placements'], false, 2],
  ['HR interview answers', 'Tell me about yourself: 3 lines - education, what I build, what I want\nStrength: I finish what I start\nWeakness: I over-polish UI, now time-boxing it\nWhy this company: their engineering blog on scaling', ['placements'], false, 13],
  ['Hackathon - team roles', 'Ananya: UI + pitch deck\nKarthik: ML model\nMe: backend + deployment\nVarun: database + integration\n\nSubmission closes Saturday 11:59 PM.', ['college', 'work'], false, 30],
  ['Lab record pending', 'Exp 6: REST API with Express - write output screenshots\nExp 7: MongoDB CRUD with mongosh\nExp 8: Mongoose schema validation\nSubmit by Friday to the lab in-charge.', ['college', 'todo'], false, 4],
  ['Weekend plan', 'Saturday: finish the lab record, movie at 7\nSunday: laundry, call home, revise DBMS for 2 hours', ['personal'], false, 5],
  ['Git commands I keep forgetting', 'git switch -c feature/x\ngit stash / git stash pop\ngit log --oneline --graph\ngit restore --staged file\ngit commit --amend (only before pushing!)', ['fullstack', 'work'], false, 19],
  ['Podcast: Lex Fridman with an AI researcher', 'Good point about learning fundamentals over frameworks. Frameworks change every few years, data structures and networking do not.', ['reading', 'ideas'], false, 27],
  ['Birthday gift ideas for Amma', 'Silk saree from the Sunday market\nPhoto album of the family trip\nPlant for the balcony\nCake from the bakery near home', ['personal'], false, 35],
  ['Electives for next semester', 'Options: Cloud Computing, Blockchain, Computer Vision, DevOps\nLeaning towards Cloud Computing (useful for placements)\nAsk seniors about the faculty for each.', ['college'], false, 21],
  ['Coffee shop study spots', 'Third Wave near the main gate - good wifi, closes 11pm\nLibrary 2nd floor - silent, AC\nRooftop of block C - only in the evening', ['personal'], false, 40],
  ['Learning plan: TypeScript', 'Week 1: basic types, interfaces\nWeek 2: generics\nWeek 3: convert a small Express API to TS\nDo it after placements.', ['ideas', 'fullstack'], false, 33],
  ['Investing basics', 'Emergency fund first (3 months expenses)\nIndex fund SIP over picking stocks\nDo not trade options\nRead "The Psychology of Money"', ['finance', 'reading'], false, 45],
  ['Hostel room fixes', 'Fan regulator broken - complaint no. 2214\nAsk for a new mattress\nTube light in the corridor', ['personal', 'todo'], false, 9],
  ['Paneer bhurji', 'Crumble 200g paneer. Fry onion, tomato, capsicum, turmeric, chilli, salt. Add paneer for 3 minutes. Top with coriander. Goes great with rotis.', ['recipes'], false, 31],
  ['Yoga for back pain', 'Cat-cow 10 reps\nChild pose 1 minute\nCobra 3x20 seconds\nSit straight while coding, screen at eye level!', ['fitness'], false, 26],
];

async function seed() {
  await connectDB();

  // "npm run seed -- you@email.com" adds the sample notes to an existing account
  // without touching that user's own notes. With no email, it resets the demo account.
  const targetEmail = process.argv[2];
  let user;
  let existingTitles = new Set();
  if (targetEmail) {
    user = await User.findOne({ email: targetEmail.toLowerCase() });
    if (!user) throw new Error(`No account found for ${targetEmail}`);
    existingTitles = new Set(await Note.distinct('title', { user: user._id }));
  } else {
    user = await User.findOne({ email: DEMO.email });
    if (!user) user = await User.create(DEMO);
    await Note.deleteMany({ user: user._id });
  }

  const now = Date.now();
  const docs = [];
  for (const [title, content, tags, pinned, daysAgo] of NOTES) {
    if (existingTitles.has(title)) continue; // don't add the same sample twice
    const note = new Note({ user: user._id, title, content, tags, pinned });
    await note.validate(); // same schema rules as the API
    // Spread the dates out so the list looks like real use over two months
    const created = new Date(now - daysAgo * 86400000 - Math.floor(Math.random() * 6) * 3600000);
    docs.push({ ...note.toObject(), createdAt: created, updatedAt: created });
  }
  // Insert directly so our custom createdAt/updatedAt dates are kept
  if (docs.length) await Note.collection.insertMany(docs);

  console.log(
    targetEmail
      ? `Added ${docs.length} sample notes to ${user.email}`
      : `Seeded ${docs.length} notes for ${DEMO.email} (password: ${DEMO.password})`
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
