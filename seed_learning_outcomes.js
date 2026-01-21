const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const LearningOutcome = require('./models/LearningOutcome');
const { Class, Subject } = require('./models/Metadata');

dotenv.config();

// Mathematics Subject Learning Outcomes (SUBJECT type)
const mathematicsOutcomes = [
  // Class 1
  {
    class: 1,
    topic: "Numbers up to 20",
    learning_outcome: "Recites number names and counts objects up to 20, concretely, pictorially and symbolically."
  },
  {
    class: 1,
    topic: "Numbers up to 20",
    learning_outcome: "Compares numbers up to 20, e.g., tells whether number of girls or boys is more in class."
  },
  {
    class: 1,
    topic: "Addition & Subtraction (1–20)",
    learning_outcome: "Constructs addition facts up to 9 using concrete objects, e.g., 3+3=6 by counting forward."
  },
  {
    class: 1,
    topic: "Addition & Subtraction (1–20)",
    learning_outcome: "Subtracts numbers using 1–9, e.g., takes 3 objects from 9, counts remaining to conclude 9–3=6."
  },
  {
    class: 1,
    topic: "Shapes",
    learning_outcome: "Describes physical features of solids/shapes in own language, e.g., a ball rolls, a box slides."
  },
  {
    class: 1,
    topic: "Measurement",
    learning_outcome: "Estimates and measures short lengths using non-uniform units like finger, hand span, footsteps."
  },
  {
    class: 1,
    topic: "Patterns",
    learning_outcome: "Observes, extends and creates patterns of shapes and numbers, e.g., 1,2,3,4,5 or 2,4,6,…"
  },
  {
    class: 1,
    topic: "Data Handling",
    learning_outcome: "Collects, records (using pictures/numerals) and interprets simple information from visuals."
  },
  {
    class: 1,
    topic: "Zero",
    learning_outcome: "Develops the concept of zero."
  },
  // Class 2
  {
    class: 2,
    topic: "Numbers up to 99",
    learning_outcome: "Reads and writes numerals for numbers up to 99."
  },
  {
    class: 2,
    topic: "Place Value",
    learning_outcome: "Uses place value in writing and comparing two-digit numbers."
  },
  {
    class: 2,
    topic: "Forming Numbers",
    learning_outcome: "Forms greatest and smallest two-digit numbers with/without repetition of digits."
  },
  {
    class: 2,
    topic: "Addition & Subtraction",
    learning_outcome: "Solves daily life problems using addition and subtraction of two-digit numbers."
  },
  {
    class: 2,
    topic: "Money",
    learning_outcome: "Represents amount up to ₹100 using notes and coins of same/different denominations."
  },
  {
    class: 2,
    topic: "Shapes",
    learning_outcome: "Identifies basic 3D shapes like cuboid, cylinder, cone, sphere by name."
  },
  {
    class: 2,
    topic: "Lines",
    learning_outcome: "Distinguishes between straight and curved lines."
  },
  {
    class: 2,
    topic: "Measurement",
    learning_outcome: "Estimates and measures length using uniform non-standard units like rod, pencil, cup."
  },
  {
    class: 2,
    topic: "Time",
    learning_outcome: "Identifies days of week and months of year."
  },
  {
    class: 2,
    topic: "Data Handling",
    learning_outcome: "Draws inference from collected data, e.g., number of vehicles used in one house vs another."
  },
  // Class 3
  {
    class: 3,
    topic: "Numbers up to 999",
    learning_outcome: "Reads and writes numbers up to 999 using place value."
  },
  {
    class: 3,
    topic: "Comparison of Numbers",
    learning_outcome: "Compares numbers up to 999 based on place value."
  },
  {
    class: 3,
    topic: "Addition & Subtraction",
    learning_outcome: "Solves daily life problems using addition/subtraction of three-digit numbers with/without regrouping."
  },
  {
    class: 3,
    topic: "Multiplication",
    learning_outcome: "Constructs and uses multiplication tables of 2,3,4,5,10 in daily situations."
  },
  {
    class: 3,
    topic: "Division",
    learning_outcome: "Explains division by equal grouping/sharing and finds result by repeated subtraction."
  },
  {
    class: 3,
    topic: "Money",
    learning_outcome: "Adds and subtracts amounts of money with/without regrouping."
  },
  {
    class: 3,
    topic: "2D Shapes",
    learning_outcome: "Identifies and makes 2D shapes by paper folding, cutting, using straight lines."
  },
  {
    class: 3,
    topic: "Measurement",
    learning_outcome: "Estimates and measures length using standard units (cm, m)."
  },
  {
    class: 3,
    topic: "Weight",
    learning_outcome: "Weighs objects using grams and kilograms with simple balance."
  },
  {
    class: 3,
    topic: "Time",
    learning_outcome: "Reads time correctly to the hour using clock/watch."
  },
  {
    class: 3,
    topic: "Patterns",
    learning_outcome: "Extends patterns in simple shapes and numbers."
  },
  {
    class: 3,
    topic: "Data Handling",
    learning_outcome: "Records data using tally marks, represents pictorially, draws conclusions."
  },
  // Class 4
  {
    class: 4,
    topic: "Multiplication",
    learning_outcome: "Multiplies 2 and 3 digit numbers using standard algorithm."
  },
  {
    class: 4,
    topic: "Division",
    learning_outcome: "Divides a number by another using pictorial, grouping, repeated subtraction methods."
  },
  {
    class: 4,
    topic: "Fractions",
    learning_outcome: "Identifies half, one-fourth, three-fourths of a whole by paper folding and in collections."
  },
  {
    class: 4,
    topic: "Fractions",
    learning_outcome: "Represents fractions as half, one-fourth, three-fourths using numbers."
  },
  {
    class: 4,
    topic: "Geometry – Circle",
    learning_outcome: "Identifies centre, radius, diameter of circle."
  },
  {
    class: 4,
    topic: "Geometry – Symmetry",
    learning_outcome: "Shows symmetry through paper folding/cutting, ink blots, etc."
  },
  {
    class: 4,
    topic: "Views of Objects",
    learning_outcome: "Draws top, front and side views of simple objects."
  },
  {
    class: 4,
    topic: "Area & Perimeter",
    learning_outcome: "Explores area and perimeter of triangle, rectangle, square in given units."
  },
  {
    class: 4,
    topic: "Measurement",
    learning_outcome: "Converts metre to centimetre and vice versa."
  },
  {
    class: 4,
    topic: "Time",
    learning_outcome: "Reads clock time in hour and minutes, expresses time in a.m./p.m."
  },
  {
    class: 4,
    topic: "Patterns",
    learning_outcome: "Identifies patterns in multiplication and division (up to multiples of 9)."
  },
  {
    class: 4,
    topic: "Data Handling",
    learning_outcome: "Represents collected information in tables and bar graphs, draws inferences."
  },
  // Class 5
  {
    class: 5,
    topic: "Large Numbers",
    learning_outcome: "Reads and writes numbers bigger than 1000 used in surroundings."
  },
  {
    class: 5,
    topic: "Operations",
    learning_outcome: "Performs four basic operations on numbers beyond 1000 using place value."
  },
  {
    class: 5,
    topic: "Estimation",
    learning_outcome: "Estimates sum, difference, product, quotient and verifies using standard algorithms."
  },
  {
    class: 5,
    topic: "Fractions",
    learning_outcome: "Finds number corresponding to part of a collection."
  },
  {
    class: 5,
    topic: "Fractions",
    learning_outcome: "Identifies and forms equivalent fractions of a given fraction."
  },
  {
    class: 5,
    topic: "Decimals",
    learning_outcome: "Expresses fractions like 1/2, 1/4, 1/5 in decimal notation and vice versa."
  },
  {
    class: 5,
    topic: "Angles",
    learning_outcome: "Classifies angles into right, acute, obtuse and represents by drawing/tracing."
  },
  {
    class: 5,
    topic: "Symmetry",
    learning_outcome: "Identifies 2D shapes with rotation and reflection symmetry."
  },
  {
    class: 5,
    topic: "3D Shapes",
    learning_outcome: "Makes cube, cylinder, cone using nets."
  },
  {
    class: 5,
    topic: "Unit Conversion",
    learning_outcome: "Converts larger to smaller units of length, weight, volume and vice versa."
  },
  {
    class: 5,
    topic: "Volume Estimation",
    learning_outcome: "Estimates volume of solid body in known units, e.g., bucket volume = 20 mugs."
  },
  // Class 6
  {
    class: 6,
    topic: "Integers",
    learning_outcome: "Understands integers, represents them on number line, compares and orders."
  },
  {
    class: 6,
    topic: "Fractions",
    learning_outcome: "Compares, adds, subtracts fractions with like/unlike denominators."
  },
  {
    class: 6,
    topic: "Decimals",
    learning_outcome: "Performs operations on decimals and uses them in money, measurement contexts."
  },
  {
    class: 6,
    topic: "Basic Algebra",
    learning_outcome: "Uses variables to form expressions, solves simple equations."
  },
  {
    class: 6,
    topic: "Ratio & Proportion",
    learning_outcome: "Understands ratio, proportion and applies in unitary method."
  },
  {
    class: 6,
    topic: "Geometry – Angles",
    learning_outcome: "Measures and classifies angles, understands perpendicular and parallel lines."
  },
  {
    class: 6,
    topic: "Mensuration",
    learning_outcome: "Finds perimeter and area of rectangle, square, triangle."
  },
  {
    class: 6,
    topic: "Data Handling",
    learning_outcome: "Organises data using tally marks, bar graphs, interprets them."
  },
  // Class 7
  {
    class: 7,
    topic: "Integers & Fractions",
    learning_outcome: "Multiplies and divides integers, fractions, decimals."
  },
  {
    class: 7,
    topic: "Algebraic Expressions",
    learning_outcome: "Adds, subtracts, simplifies algebraic expressions."
  },
  {
    class: 7,
    topic: "Linear Equations",
    learning_outcome: "Solves linear equations in one variable."
  },
  {
    class: 7,
    topic: "Ratio & Proportion",
    learning_outcome: "Applies percentages, profit/loss, simple interest."
  },
  {
    class: 7,
    topic: "Geometry – Triangles",
    learning_outcome: "Understands congruence of triangles, applies criteria."
  },
  {
    class: 7,
    topic: "Symmetry",
    learning_outcome: "Identifies rotational symmetry, draws symmetrical figures."
  },
  {
    class: 7,
    topic: "Mensuration",
    learning_outcome: "Finds area of parallelogram, triangle, circle."
  },
  {
    class: 7,
    topic: "Statistics",
    learning_outcome: "Calculates mean, median, mode of data."
  },
  // Class 8
  {
    class: 8,
    topic: "Rational Numbers",
    learning_outcome: "Understands rational numbers, represents on number line, performs operations."
  },
  {
    class: 8,
    topic: "Linear Equations",
    learning_outcome: "Solves linear equations in one variable, word problems."
  },
  {
    class: 8,
    topic: "Quadrilaterals",
    learning_outcome: "Understands properties of quadrilaterals, applies in problems."
  },
  {
    class: 8,
    topic: "Data Handling",
    learning_outcome: "Constructs and interprets pie charts, calculates probability."
  },
  {
    class: 8,
    topic: "Mensuration",
    learning_outcome: "Finds surface area and volume of cube, cuboid, cylinder."
  },
  {
    class: 8,
    topic: "Algebra – Identities",
    learning_outcome: "Expands using algebraic identities, factorises expressions."
  },
  // Class 9
  {
    class: 9,
    topic: "Number Systems",
    learning_outcome: "Represents real numbers on number line, operations on irrational numbers."
  },
  {
    class: 9,
    topic: "Polynomials",
    learning_outcome: "Factorises polynomials, uses remainder theorem."
  },
  {
    class: 9,
    topic: "Coordinate Geometry",
    learning_outcome: "Plots points in Cartesian plane, finds distance between points."
  },
  {
    class: 9,
    topic: "Linear Equations in Two Variables",
    learning_outcome: "Solves pair of linear equations graphically and algebraically."
  },
  {
    class: 9,
    topic: "Euclid's Geometry",
    learning_outcome: "Understands axioms, postulates, proves theorems on lines and angles."
  },
  {
    class: 9,
    topic: "Triangles",
    learning_outcome: "Proves congruence, similarity of triangles, applies Pythagoras theorem."
  },
  {
    class: 9,
    topic: "Heron's Formula",
    learning_outcome: "Finds area of triangle using Heron's formula."
  },
  {
    class: 9,
    topic: "Statistics",
    learning_outcome: "Calculates mean, median, mode of grouped data."
  },
  // Class 10
  {
    class: 10,
    topic: "Real Numbers",
    learning_outcome: "Applies Euclid's division lemma, finds HCF, LCM."
  },
  {
    class: 10,
    topic: "Polynomials",
    learning_outcome: "Finds zeroes of polynomials, verifies relationship between zeroes and coefficients."
  },
  {
    class: 10,
    topic: "Pair of Linear Equations",
    learning_outcome: "Solves pair of linear equations in two variables using substitution, elimination, cross-multiplication."
  },
  {
    class: 10,
    topic: "Quadratic Equations",
    learning_outcome: "Solves quadratic equations by factorisation, completing square, quadratic formula."
  },
  {
    class: 10,
    topic: "Arithmetic Progressions",
    learning_outcome: "Finds nth term and sum of n terms of AP."
  },
  {
    class: 10,
    topic: "Triangles",
    learning_outcome: "Applies basic proportionality theorem, similarity criteria."
  },
  {
    class: 10,
    topic: "Coordinate Geometry",
    learning_outcome: "Finds distance, section formula, area of triangle."
  },
  {
    class: 10,
    topic: "Trigonometry",
    learning_outcome: "Defines trigonometric ratios, proves identities, solves heights and distances problems."
  },
  {
    class: 10,
    topic: "Circles",
    learning_outcome: "Proves tangent properties, theorems related to chords."
  },
  {
    class: 10,
    topic: "Constructions",
    learning_outcome: "Constructs triangles, tangents to circles, divides line segment in given ratio."
  },
  {
    class: 10,
    topic: "Mensuration",
    learning_outcome: "Finds surface area and volume of combinations of solids."
  },
  {
    class: 10,
    topic: "Statistics & Probability",
    learning_outcome: "Calculates mean by step deviation, understands empirical probability."
  },
  // Class 11
  {
    class: 11,
    topic: "Sets",
    learning_outcome: "Understands sets, subsets, Venn diagrams, operations on sets."
  },
  {
    class: 11,
    topic: "Relations & Functions",
    learning_outcome: "Defines relations, functions, domain, range, types of functions."
  },
  {
    class: 11,
    topic: "Trigonometric Functions",
    learning_outcome: "Understands radians, trigonometric identities, graphs of trigonometric functions."
  },
  {
    class: 11,
    topic: "Complex Numbers",
    learning_outcome: "Performs operations on complex numbers, finds modulus, argument."
  },
  {
    class: 11,
    topic: "Linear Inequalities",
    learning_outcome: "Solves linear inequalities in one/two variables."
  },
  {
    class: 11,
    topic: "Permutations & Combinations",
    learning_outcome: "Applies fundamental principle of counting, permutations, combinations."
  },
  {
    class: 11,
    topic: "Binomial Theorem",
    learning_outcome: "Expands binomials, finds general term, middle term."
  },
  {
    class: 11,
    topic: "Sequences & Series",
    learning_outcome: "Finds nth term and sum of AP, GP, HP."
  },
  {
    class: 11,
    topic: "Straight Lines",
    learning_outcome: "Finds slope, equation, angle between lines, distance of point from line."
  },
  {
    class: 11,
    topic: "Conic Sections",
    learning_outcome: "Identifies and finds equations of parabola, ellipse, hyperbola."
  },
  {
    class: 11,
    topic: "Limits & Derivatives",
    learning_outcome: "Evaluates limits, finds derivatives using first principles, rules."
  },
  {
    class: 11,
    topic: "Statistics",
    learning_outcome: "Calculates mean deviation, variance, standard deviation."
  },
  {
    class: 11,
    topic: "Probability",
    learning_outcome: "Understands sample space, events, calculates probability of events."
  },
  // Class 12
  {
    class: 12,
    topic: "Relations & Functions",
    learning_outcome: "Understands types of relations, functions, composition, invertibility."
  },
  {
    class: 12,
    topic: "Inverse Trigonometric Functions",
    learning_outcome: "Finds principal values, proves properties, solves equations."
  },
  {
    class: 12,
    topic: "Matrices",
    learning_outcome: "Performs matrix operations, finds transpose, inverse, solves equations."
  },
  {
    class: 12,
    topic: "Determinants",
    learning_outcome: "Evaluates determinants, applies in solving linear equations, area of triangle."
  },
  {
    class: 12,
    topic: "Continuity & Differentiability",
    learning_outcome: "Checks continuity, finds derivatives of composite, implicit, inverse functions."
  },
  {
    class: 12,
    topic: "Application of Derivatives",
    learning_outcome: "Finds rate of change, tangents/normals, maxima/minima."
  },
  {
    class: 12,
    topic: "Integrals",
    learning_outcome: "Integrates using substitution, partial fractions, by parts."
  },
  {
    class: 12,
    topic: "Application of Integrals",
    learning_outcome: "Finds area under curve, between curves."
  },
  {
    class: 12,
    topic: "Differential Equations",
    learning_outcome: "Formulates and solves differential equations."
  },
  {
    class: 12,
    topic: "Vector Algebra",
    learning_outcome: "Performs vector operations, finds scalar and vector products."
  },
  {
    class: 12,
    topic: "3D Geometry",
    learning_outcome: "Finds equations of lines, planes, angles, distances."
  },
  {
    class: 12,
    topic: "Linear Programming",
    learning_outcome: "Formulates LPP, solves graphically."
  },
  {
    class: 12,
    topic: "Probability",
    learning_outcome: "Understands conditional probability, Bayes' theorem, probability distributions."
  }
];

// Basic Calculation Learning Outcomes (BASIC_CALCULATION type)
const basicCalculationOutcomes = [
  // Class 1
  {
    class: 1,
    topic: "Addition (1–20)",
    learning_outcome: "Constructs addition facts up to 9 using concrete objects, e.g., finds 3+3 by counting forward."
  },
  {
    class: 1,
    topic: "Subtraction (1–20)",
    learning_outcome: "Subtracts numbers using 1–9, e.g., takes away 3 objects from 9 to find remaining."
  },
  // Class 2
  {
    class: 2,
    topic: "Addition (Two-digit)",
    learning_outcome: "Solves daily life problems using addition of two-digit numbers without regrouping."
  },
  {
    class: 2,
    topic: "Subtraction (Two-digit)",
    learning_outcome: "Solves daily life problems using subtraction of two-digit numbers without regrouping."
  },
  // Class 3
  {
    class: 3,
    topic: "Addition (Three-digit)",
    learning_outcome: "Adds three-digit numbers with and without regrouping, sums not exceeding 999."
  },
  {
    class: 3,
    topic: "Subtraction (Three-digit)",
    learning_outcome: "Subtracts three-digit numbers with and without regrouping."
  },
  {
    class: 3,
    topic: "Multiplication (Tables 2–10)",
    learning_outcome: "Constructs and uses multiplication tables of 2, 3, 4, 5, and 10 in daily life."
  },
  {
    class: 3,
    topic: "Division (Grouping/Sharing)",
    learning_outcome: "Explains division by equal grouping/sharing and finds result by repeated subtraction."
  },
  // Class 4
  {
    class: 4,
    topic: "Multiplication (2 & 3-digit)",
    learning_outcome: "Multiplies 2 and 3-digit numbers by 1-digit numbers using standard algorithm."
  },
  {
    class: 4,
    topic: "Division (Basic)",
    learning_outcome: "Divides a number by another using grouping, repeated subtraction, and pictorial methods."
  },
  {
    class: 4,
    topic: "Addition/Subtraction (Money)",
    learning_outcome: "Adds and subtracts amounts of money with/without regrouping in real-life contexts."
  },
  // Class 5
  {
    class: 5,
    topic: "Multiplication (Large Numbers)",
    learning_outcome: "Multiplies numbers beyond 1000 using place value understanding."
  },
  {
    class: 5,
    topic: "Division (Large Numbers)",
    learning_outcome: "Divides numbers beyond 1000 by another number using standard algorithm."
  },
  {
    class: 5,
    topic: "All Operations (Estimation)",
    learning_outcome: "Estimates sum, difference, product, and quotient of large numbers and verifies with actual calculation."
  },
  // Class 6
  {
    class: 6,
    topic: "Addition/Subtraction (Integers)",
    learning_outcome: "Adds and subtracts integers using number line and rules."
  },
  {
    class: 6,
    topic: "Multiplication/Division (Integers)",
    learning_outcome: "Multiplies and divides integers, understanding sign rules."
  },
  {
    class: 6,
    topic: "All Operations (Fractions)",
    learning_outcome: "Adds, subtracts, multiplies, and divides fractions with like/unlike denominators."
  },
  {
    class: 6,
    topic: "All Operations (Decimals)",
    learning_outcome: "Performs addition, subtraction, multiplication, and division on decimals."
  },
  // Class 7
  {
    class: 7,
    topic: "Multiplication/Division (Rational Numbers)",
    learning_outcome: "Multiplies and divides rational numbers, understanding reciprocal."
  },
  {
    class: 7,
    topic: "Algebraic Expressions (Addition/Subtraction)",
    learning_outcome: "Adds and subtracts algebraic expressions."
  },
  {
    class: 7,
    topic: "Percentage Calculations",
    learning_outcome: "Applies percentage in profit/loss, simple interest calculations."
  },
  // Class 8
  {
    class: 8,
    topic: "All Operations (Rational Numbers)",
    learning_outcome: "Performs all four operations on rational numbers."
  },
  {
    class: 8,
    topic: "Linear Equations (One Variable)",
    learning_outcome: "Solves linear equations in one variable using addition/subtraction/multiplication/division."
  },
  {
    class: 8,
    topic: "Algebraic Identities (Multiplication)",
    learning_outcome: "Expands algebraic expressions using identities like (a+b)², (a-b)²."
  },
  // Class 9
  {
    class: 9,
    topic: "Real Numbers (Operations)",
    learning_outcome: "Performs operations on real numbers including irrational numbers."
  },
  {
    class: 9,
    topic: "Polynomials (Multiplication/Division)",
    learning_outcome: "Multiplies polynomials, divides polynomial by another using long division."
  },
  {
    class: 9,
    topic: "Linear Equations (Two Variables)",
    learning_outcome: "Solves pair of linear equations using elimination/substitution methods."
  },
  // Class 10
  {
    class: 10,
    topic: "Quadratic Equations (Factorization)",
    learning_outcome: "Solves quadratic equations by factorization method."
  },
  {
    class: 10,
    topic: "Arithmetic Progressions (Sum)",
    learning_outcome: "Finds sum of n terms of AP using formula S = n/2 [2a + (n-1)d]."
  },
  {
    class: 10,
    topic: "Trigonometric Ratios (Calculation)",
    learning_outcome: "Calculates trigonometric ratios for standard angles (0°, 30°, 45°, 60°, 90°)."
  },
  // Class 11
  {
    class: 11,
    topic: "Complex Numbers (Operations)",
    learning_outcome: "Adds, subtracts, multiplies, and divides complex numbers."
  },
  {
    class: 11,
    topic: "Permutations & Combinations (Counting)",
    learning_outcome: "Applies multiplication and addition principles of counting."
  },
  {
    class: 11,
    topic: "Binomial Theorem (Expansion)",
    learning_outcome: "Expands binomial expressions using binomial theorem."
  },
  {
    class: 11,
    topic: "Sequences & Series (Summation)",
    learning_outcome: "Finds sum of AP, GP, and HP using formulas."
  }
];

const seedLearningOutcomes = async () => {
    try {
        await connectDB();
        console.log('Connected to database');

        // Get Mathematics subject
        const mathematics = await Subject.findOne({ name: 'Mathematics' });
        if (!mathematics) {
            console.error('Mathematics subject not found. Please seed subjects first.');
            process.exit(1);
        }

        // Get all classes
        const classes = await Class.find({}).sort({ level: 1 });
        const classMap = {};
        classes.forEach(cls => {
            classMap[cls.level] = cls._id;
        });

        console.log('\n=== Seeding Mathematics Learning Outcomes (SUBJECT type) ===\n');
        let subjectCount = 0;

        for (const outcome of mathematicsOutcomes) {
            const classId = classMap[outcome.class];
            if (!classId) {
                console.log(`⚠️  Class ${outcome.class} not found, skipping...`);
                continue;
            }

            // Check if outcome already exists
            const existing = await LearningOutcome.findOne({
                text: outcome.learning_outcome,
                type: 'SUBJECT',
                classId: classId,
                subjectId: mathematics._id
            });

            if (!existing) {
                await LearningOutcome.create({
                    text: outcome.learning_outcome,
                    type: 'SUBJECT',
                    classId: classId,
                    subjectId: mathematics._id,
                    topicName: outcome.topic,
                    instruction: `Focus on ${outcome.topic}`
                });
                subjectCount++;
                console.log(`✓ Class ${outcome.class} - ${outcome.topic}: ${outcome.learning_outcome.substring(0, 60)}...`);
            } else {
                console.log(`⊘ Class ${outcome.class} - ${outcome.topic}: Already exists`);
            }
        }

        console.log(`\n✅ Created ${subjectCount} Mathematics learning outcomes\n`);

        console.log('\n=== Seeding Basic Calculation Learning Outcomes (BASIC_CALCULATION type) ===\n');
        let basicCount = 0;

        for (const outcome of basicCalculationOutcomes) {
            const classId = classMap[outcome.class];
            if (!classId) {
                console.log(`⚠️  Class ${outcome.class} not found, skipping...`);
                continue;
            }

            // Check if outcome already exists
            const existing = await LearningOutcome.findOne({
                text: outcome.learning_outcome,
                type: 'BASIC_CALCULATION',
                classId: classId
            });

            if (!existing) {
                await LearningOutcome.create({
                    text: outcome.learning_outcome,
                    type: 'BASIC_CALCULATION',
                    classId: classId,
                    topicName: outcome.topic,
                    instruction: `Practice ${outcome.topic}`
                });
                basicCount++;
                console.log(`✓ Class ${outcome.class} - ${outcome.topic}: ${outcome.learning_outcome.substring(0, 60)}...`);
            } else {
                console.log(`⊘ Class ${outcome.class} - ${outcome.topic}: Already exists`);
            }
        }

        console.log(`\n✅ Created ${basicCount} Basic Calculation learning outcomes\n`);

        console.log('=== Summary ===');
        console.log(`Total Mathematics (SUBJECT) outcomes: ${subjectCount}`);
        console.log(`Total Basic Calculation outcomes: ${basicCount}`);
        console.log(`Grand Total: ${subjectCount + basicCount}`);

        console.log('\n✅ Seeding Complete!');
        process.exit(0);

    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedLearningOutcomes();
