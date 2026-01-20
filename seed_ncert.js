const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Class, Subject, Topic } = require('./models/Metadata');
const Chapter = require('./models/Chapter');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("MongoDB Connected for Seeding...");

        // 1. Ensure Subject "Mathematics"
        let subject = await Subject.findOne({ name: "Mathematics" });
        if (!subject) {
            subject = await Subject.create({ name: "Mathematics" });
            console.log("Created Subject: Mathematics");
        } else {
            console.log("Subject exists: Mathematics");
        }

        // 2. Define Topics
        // Creating a set of comprehensive topics based on the mapping
        const topicNames = [
            "Number Systems",
            "Fractions & Decimals",
            "Algebra",
            "Geometry",
            "Mensuration",
            "Data Handling & Statistics",
            "Probability",
            "Time",
            "Measurement", // For Jugs/Mugs, Weights
            "Calculus", // For 11/12
            "Vectors & 3D", // For 12
            "Relations & Functions", // For 11/12
            "sets",
            "Trigonometry"
        ];

        const topicsMap = {};
        for (const name of topicNames) {
            let t = await Topic.findOne({ name });
            if (!t) {
                t = await Topic.create({ name });
                console.log(`Created Topic: ${name}`);
            }
            topicsMap[name] = t._id; // Store ID for linking
        }

        // Helper to find Topic Name by keyword (heuristic)
        const getTopicForChapter = (name, classLevel) => {
            const n = name.toLowerCase();
            if (n.includes("play with numbers") || n.includes("fun with numbers") || n.includes("double century") || n.includes("building with bricks") || n.includes("number") || n.includes("prime") || n.includes("factor") || n.includes("multiple")) return "Number Systems";
            if (n.includes("fraction") || n.includes("decimal") || n.includes("halves") || n.includes("quarter") || n.includes("parts and whol") || n.includes("tenth")) return "Fractions & Decimals";
            if (n.includes("algebra") || n.includes("equation") || n.includes("polynomial") || n.includes("pattern") || n.includes("arithmetic progression") || n.includes("inequalities") || n.includes("series") || n.includes("binomial") || n.includes("complex number") || n.includes("matrices") || n.includes("determinant")) return "Algebra";
            if (n.includes("shape") || n.includes("line") || n.includes("angle") || n.includes("triangle") || n.includes("quadrilateral") || n.includes("circle") || n.includes("geometry") || n.includes("symmetry") || n.includes("construction") || n.includes("conic")) return "Geometry";
            if (n.includes("area") || n.includes("perimeter") || n.includes("surface") || n.includes("volume") || n.includes("heron") || n.includes("box") || n.includes("field") || n.includes("fence")) return "Mensuration";
            if (n.includes("data") || n.includes("chart") || n.includes("graph") || n.includes("statistic")) return "Data Handling & Statistics";
            if (n.includes("probability")) return "Probability";
            if (n.includes("time") || n.includes("tick")) return "Time";
            if (n.includes("jug") || n.includes("mug") || n.includes("heavy") || n.includes("light") || n.includes("lift") || n.includes("fill") || n.includes("measure")) return "Measurement";
            if (n.includes("integral") || n.includes("derivative") || n.includes("limits") || n.includes("continuity") || n.includes("differential")) return "Calculus";
            if (n.includes("vector") || n.includes("three dimensional") || n.includes("3d")) return "Vectors & 3D";
            if (n.includes("relation") || n.includes("function") || n.includes("set")) return "Relations & Functions";
            if (n.includes("trigonomet")) return "Trigonometry";

            // Fallbacks for specific titles
            if (name === "Money" || name.includes("Rupee")) return "Number Systems";
            if (name === "The Fish Tale") return "Number Systems"; // Class 5 (Large numbers)
            if (name === "A Trip to Bhopal") return "Number Systems"; // Mixed word probs
            if (name === "The Junk Seller") return "Number Systems"; // Money
            if (name === "Mapping Your Way") return "Geometry"; // Spatial
            if (name === "Ways to Multiply and Divide") return "Number Systems";
            if (name === "Smart Charts") return "Data Handling & Statistics";

            return "Number Systems"; // Default
        };

        // 3. Define Data
        const classData = [
            {
                level: 2,
                name: "Class 2",
                chapters: [
                    "A Day at the Beach", "Shapes Around Us", "Fun with Numbers", "Shadow Story (Togalu)",
                    "Playing with Lines", "Decoration for Festival", "Rani’s Gift", "Grouping and Sharing",
                    "Which Season is it?", "Fun at the Fair", "Data Handling"
                ]
            },
            {
                level: 3,
                name: "Class 3",
                chapters: [
                    "What’s in a Name?", "Toy Joy", "Double Century", "Vacation with My Nani Maa",
                    "Fun with Shapes", "House of Hundreds – I", "Raksha Bandhan", "Fair Share",
                    "House of Hundreds – II", "Fun at Class Party!", "Filling and Lifting",
                    "Give and Take", "Time Goes On", "The Surajkund Fair"
                ]
            },
            {
                level: 4,
                name: "Class 4",
                chapters: [
                    "Building with Bricks", "Long and Short", "A Trip to Bhopal", "Tick-Tick-Tick",
                    "The Way The World Looks", "The Junk Seller", "Jugs and Mugs", "Carts and Wheels",
                    "Halves and Quarters", "Play with Patterns", "Tables and Shares", "How Heavy? How Light?",
                    "Fields and Fences", "Smart Charts"
                ]
            },
            {
                level: 5,
                name: "Class 5",
                chapters: [
                    "The Fish Tale", "Shapes and Angles", "How Many Squares?", "Parts and Wholes",
                    "Does it Look the Same?", "Be My Multiple, I’ll be Your Factor", "Can You See the Pattern?",
                    "Mapping Your Way", "Boxes and Sketches", "Tenths and Hundredths", "Area and its Boundary",
                    "Smart Charts", "Ways to Multiply and Divide", "How Big? How Heavy?"
                ]
            },
            {
                level: 6,
                name: "Class 6",
                chapters: [
                    "Patterns in Mathematics", "Lines and Angles", "Number Play", "Data Handling and Presentation",
                    "Prime Time", "Perimeter and Area", "Fractions", "Playing with Constructions", "Symmetry", "The Other Side of Zero"
                ]
            },
            {
                level: 7,
                name: "Class 7",
                chapters: [
                    "Integers", "Fractions and Decimals", "Data Handling", "Simple Equations", "Lines and Angles",
                    "The Triangles and Its Properties", "Comparing Quantities", "Rational Numbers", "Perimeter and Area",
                    "Algebraic Expressions", "Exponents and Powers", "Symmetry", "Visualising Solid Shapes"
                ]
            },
            {
                level: 8,
                name: "Class 8",
                chapters: [
                    "Rational Numbers", "Linear Equations in one Variable", "Understanding Quadrilaterals", "Data Handling",
                    "Square and Square Roots", "Cube and Cube Roots", "Comparing Quantities", "Algebraic Expressions and Identities",
                    "Mensuration", "Exponents and Powers", "Direct and Inverse Proportions", "Factorization", "Introduction to Graphs"
                ]
            },
            {
                level: 9,
                name: "Class 9",
                chapters: [
                    "Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables",
                    "Introduction to Euclid’s Geometry", "Lines and Angles", "Triangles", "Quadrilaterals", "Circles",
                    "Heron’s Formula", "Surface Areas and Volumes", "Statistics"
                ]
            },
            {
                level: 10,
                name: "Class 10",
                chapters: [
                    "Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations",
                    "Arithmetic Progression", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry",
                    "Some Applications of Trigonometry", "Circles", "Areas Related to Circles", "Surface Areas and Volumes",
                    "Statistics", "Probability"
                ]
            },
            {
                level: 11,
                name: "Class 11",
                chapters: [
                    "Sets", "Relations and Functions", "Trigonometric Functions", "Complex Numbers and Quadratic Equations",
                    "Linear Inequalities", "Permutations and Combinations", "Binomial Theorem", "Sequences and Series",
                    "Straight Lines", "Conic Sections", "Introduction to Three Dimensional Geometry", "Limits and Derivatives",
                    "Statistics", "Probability"
                ]
            },
            {
                level: 12,
                name: "Class 12",
                chapters: [
                    "Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants",
                    "Continuity and Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals",
                    "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability"
                ]
            }
        ];

        // 4. Processing Loop
        for (const cData of classData) {
            // Find or Create Class
            let cls = await Class.findOne({ level: cData.level });
            if (!cls) {
                cls = await Class.create({ name: cData.name, level: cData.level });
                console.log(`Created Class: ${cData.name}`);
            } else {
                console.log(`Class exists: ${cData.name}`);
            }

            // Create Chapters
            for (const chapterName of cData.chapters) {
                const topicName = getTopicForChapter(chapterName, cData.level);

                // Check if chapter exists
                const existing = await Chapter.findOne({
                    classId: cls._id,
                    subjectId: subject._id,
                    chapterName
                });

                if (!existing) {
                    await Chapter.create({
                        classId: cls._id,
                        subjectId: subject._id,
                        chapterName: chapterName,
                        topicName: topicName,
                        instructions: {
                            totalQuestions: 10,
                            timeLimitMinutes: 20,
                            passingMarks: 5,
                            difficultySplit: { easy: 4, medium: 4, hard: 2 }
                        }
                    });
                    console.log(`   + Added Chapter: ${chapterName} [${topicName}]`);
                } else {
                    // console.log(`   . Skipped: ${chapterName}`);
                }
            }
        }

        console.log("Seeding Complete!");
        process.exit();

    } catch (err) {
        console.error("Seeding Error:", err);
        process.exit(1);
    }
};

seedData();
