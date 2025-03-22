# project

## File List

- app.js
- config\cloudinary.js
- middleware\auth.js
- models\baselineScreening.js
- models\medicalRecord.js
- models\user.js
- package.json
- python_server\gemini_rag.py
- python_server\rag_server.py
- python_server\simple_rag.py
- python_server\__pycache__\gemini_rag.cpython-310.pyc
- python_server\__pycache__\test_add_data.cpython-310.pyc
- README.md
- utils\gemini.js
- views\pages\auth\login.ejs
- views\pages\auth\signup.ejs
- views\pages\caregiver\appointment-management.ejs
- views\pages\caregiver\dashboard.ejs
- views\pages\caregiver\feedback-management.ejs
- views\pages\caregiver\patient-info.ejs
- views\pages\caregiver\progress-reports.ejs
- views\pages\navigator\appointment-management.ejs
- views\pages\navigator\care-plan.ejs
- views\pages\navigator\dashboard.ejs
- views\pages\navigator\learning.ejs
- views\pages\navigator\patient-management.ejs
- views\pages\navigator\progress-tracking.ejs
- views\pages\navigator\resources.ejs
- views\pages\patient\appointments.ejs
- views\pages\patient\baseline-screening.ejs
- views\pages\patient\care-plan.ejs
- views\pages\patient\dashboard.ejs
- views\pages\patient\feedback.ejs
- views\pages\patient\medical-insights.ejs
- views\pages\patient\medical-records.ejs
- views\pages\patient\profile.ejs
- views\pages\patient\reports.ejs
- views\pages\patient\resources.ejs
- views\partials\footer.ejs
- views\partials\header.ejs
- views\partials\sidebar.ejs

## File Contents

### app.js
```
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const User = require("./models/user");
const medicalRecordsRoutes = require("./routes/medicalRecords");
const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patient");
const navigatorRoutes = require("./routes/navigator");
const caregiverRoutes = require("./routes/caregiver");
const baselineScreeningRoutes = require("./routes/baselineScreening");
const geminiRoutes = require("./routes/gemini");

var app = express();

const ATLASDB_URL = process.env.ATLASDB_URL;

// Connect to MongoDB
mongoose
  .connect(ATLASDB_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Configure middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configure session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "our little secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport-Local Strategy
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Authentication middleware
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

app.get("/login", (req, res) => {
  res.render("pages/auth/login.ejs");
});

app.post("/login", (req, res, next) => {
  const { username, password, userType } = req.body;

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred during login",
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Check if selected user type matches the registered user type
    if (user.userType !== userType) {
      return res.status(401).json({
        success: false,
        message: `You are registered as a ${user.userType}. Please select the correct user type.`,
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "An error occurred during login",
        });
      }

      // Redirect based on user type
      switch (user.userType) {
        case "Patient":
          return res.status(200).json({
            success: true,
            redirect: "/patient/dashboard",
          });
        case "Patient-Navigator":
          return res.status(200).json({
            success: true,
            redirect: "/navigator/dashboard",
          });
        case "Caregiver":
          return res.status(200).json({
            success: true,
            redirect: "/caregiver/dashboard",
          });
        default:
          return res.status(401).json({
            success: false,
            message: "Invalid user type",
          });
      }
    });
  })(req, res, next);
});

app.get("/signup", (req, res) => {
  res.render("pages/auth/signup.ejs");
});

app.post("/signup", async (req, res) => {
  try {
    const {
      username,
      password,
      fullName,
      email,
      age,
      phone,
      sex,
      address,
      userType,
    } = req.body;

    // Validate required fields
    if (!username || !password || !fullName || !email || !userType) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.username === username
            ? "Username already exists"
            : "Email already registered",
      });
    }

    const user = new User({
      username,
      fullName,
      email,
      age,
      phone,
      sex,
      address,
      userType,
    });

    const registeredUser = await User.register(user, password);

    // Login user after successful registration
    req.login(registeredUser, function (err) {
      if (err) {
        console.error("Error during login after registration:", err);
        return res.status(500).json({
          success: false,
          message:
            "Registration successful but login failed. Please log in manually.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Account created successfully!",
        redirect: `/${userType.toLowerCase().replace("-", "")}/dashboard`,
      });
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during registration",
    });
  }
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

app.get("/patient/dashboard", isLoggedIn, (req, res) => {
  if (req.user.userType !== "Patient") {
    return res.redirect(`/${req.user.userType.toLowerCase()}/dashboard`);
  }
  res.render("pages/patient/dashboard.ejs", {
    user: req.user,
    path: "/patient/dashboard",
  });
});

app.get("/patient/medical-records", isLoggedIn, (req, res) => {
  if (req.user.userType !== "Patient") {
    return res.redirect(`/${req.user.userType.toLowerCase()}/dashboard`);
  }
  res.render("pages/patient/medical-records.ejs", {
    user: req.user,
    path: "/patient/medical-records",
  });
});

app.get("/patient/appointments", isLoggedIn, (req, res) => {
  if (req.user.userType !== "Patient") {
    return res.redirect(`/${req.user.userType.toLowerCase()}/dashboard`);
  }
  res.render("pages/patient/appointments.ejs", {
    user: req.user,
    path: "/patient/appointments",
  });
});

app.get("/navigator/dashboard", isLoggedIn, (req, res) => {
  if (req.user.userType !== "Patient-Navigator") {
    return res.redirect(`/${req.user.userType.toLowerCase()}/dashboard`);
  }
  res.render("pages/navigator/dashboard.ejs", {
    user: req.user,
    path: "/navigator/dashboard",
  });
});

app.get("/caregiver/dashboard", isLoggedIn, (req, res) => {
  if (req.user.userType !== "Caregiver") {
    return res.redirect(`/${req.user.userType.toLowerCase()}/dashboard`);
  }
  res.render("pages/caregiver/dashboard.ejs", {
    user: req.user,
    path: "/caregiver/dashboard",
  });
});

// Add medical records routes
app.use("/api/medical-records", medicalRecordsRoutes);

// Use routes
app.use(authRoutes);
app.use(patientRoutes);
app.use(navigatorRoutes);
app.use(caregiverRoutes);
app.use(baselineScreeningRoutes);
app.use("/api/gemini", geminiRoutes);

// Add a server listening section at the end of the file
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

app.get("*", isLoggedIn, (req, res) => {
  res.redirect("/patient/dashboard");
});

```

### config\cloudinary.js
```
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;

```

### middleware\auth.js
```
/**
 * Middleware to check if user is logged in
 */
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: "Authentication required" });
};

module.exports = { isLoggedIn };

```

### models\baselineScreening.js
```
const mongoose = require("mongoose");

const baselineScreeningSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Drug and Medication History
  currentMedications: {
    type: [String],
    default: [],
  },
  medicationAllergies: {
    type: [String],
    default: [],
  },
  recreationalDrugUse: {
    type: String,
    enum: ["Never", "Former", "Current", "Prefer not to say"],
    default: "Never",
  },

  // Disease History
  chronicConditions: {
    type: [String],
    default: [],
  },
  pastSurgeries: {
    type: [String],
    default: [],
  },
  mentalHealthConditions: {
    type: [String],
    default: [],
  },

  // Family History
  familyHistory: {
    cancer: { type: Boolean, default: false },
    heartDisease: { type: Boolean, default: false },
    diabetes: { type: Boolean, default: false },
    autoimmune: { type: Boolean, default: false },
    mentalHealth: { type: Boolean, default: false },
    other: { type: String, default: "" },
  },

  // Social Determinants of Health
  sdoh: {
    race: { type: String, default: "" },
    education: { type: String, default: "" },
    housing: { type: String, default: "" },
    healthcareAccess: { type: String, default: "" },
    employmentStatus: { type: String, default: "" },
    foodSecurity: { type: String, default: "" },
    transportationAccess: { type: String, default: "" },
    socialSupport: { type: String, default: "" },
  },

  // Additional Information
  additionalInfo: {
    type: String,
    default: "",
  },

  // Risk Assessment Results
  riskAssessment: {
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Not Assessed"],
      default: "Not Assessed",
    },
    possibleIssues: {
      type: [String],
      default: [],
    },
    analysisExplanation: {
      type: String,
      default: "",
    },
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BaselineScreening", baselineScreeningSchema);

```

### models\medicalRecord.js
```
const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  recordType: {
    type: String,
    enum: [
      "Prescription",
      "Lab Report",
      "Imaging",
      "Discharge Summary",
      "Other",
    ],
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
  },
  recordDate: {
    type: Date,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  // For RAG
  vectorEmbedding: {
    type: [Number],
    sparse: true,
  },
  textContent: {
    type: String,
  },
  metadata: {
    type: Map,
    of: String,
  },
});

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);

```

### models\user.js
```
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  age: {
    type: Number,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  sex: {
    type: String,
    enum: ["Male", "Female"],
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ["Patient", "Patient-Navigator", "Caregiver"],
    required: true,
  },
});

// Add username, hash and salt field to schema
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);

```

### package.json
```
{
  "name": "tinkhack-2.0",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.1.3",
    "axios": "^1.8.4",
    "body-parser": "^1.20.3",
    "cloudinary": "^2.6.0",
    "connect-flash": "^0.1.1",
    "connect-mongo": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "ejs": "^3.1.10",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "form-data": "^4.0.2",
    "method-override": "^3.0.0",
    "mongoose": "^8.10.0",
    "multer": "^1.4.5-lts.2",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "passport-local-mongoose": "^8.0.0",
    "path": "^0.12.7",
    "pdf-parse": "^1.1.1"
  }
}

```

### python_server\gemini_rag.py
```
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import google.generativeai as genai
import numpy as np

app = Flask(__name__)
CORS(app)

# Initialize Gemini
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyBpwbZVpuwYwKA_F3A-bEEhvTHYjoTUIgE')
genai.configure(api_key=GEMINI_API_KEY)

# Models - using Gemini 2.0
generation_model = genai.GenerativeModel('gemini-1.5-flash')
# Using text generation for embeddings since embed_content is not available
embedding_model = generation_model

# In-memory storage
chunks_db = {}  # user_id -> [chunk_objects]

def generate_embedding(text):
    """Generate pseudo-embedding using Gemini model responses."""
    try:
        # Use a prompt to extract key features for vector representation
        prompt = f"""
        Extract 20 key medical terms or concepts from the following text, separated by commas.
        If there are fewer than 20 terms, just extract what's available.
        TEXT: {text}
        """
        
        result = generation_model.generate_content(prompt)
        terms = result.text.split(',')
        
        # Create a basic binary vector based on term presence
        # This is a simplified approach since we can't use proper embeddings
        terms_vector = np.zeros(100)  # Using a 100-dimensional space
        for i, term in enumerate(terms[:100]):
            terms_vector[i % 100] = 1  # Set positions based on terms
            
        # Normalize to unit vector for cosine similarity
        norm = np.linalg.norm(terms_vector)
        if norm > 0:
            terms_vector = terms_vector / norm
            
        return terms_vector
    except Exception as e:
        print(f"Error generating embedding: {str(e)}")
        return np.zeros(100)  # Return zero vector on error

def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors."""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def chunk_text(text, chunk_size=1000, overlap=200):
    """Split text into chunks with overlap."""
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        if len(chunk) > 100:  # Only add chunks with substantial text
            chunks.append(chunk)
    return chunks

def search_chunks(user_id, query_embedding, limit=5):
    """Search for relevant chunks."""
    if user_id not in chunks_db or not chunks_db[user_id]:
        return []
    
    results = []
    for chunk in chunks_db[user_id]:
        if chunk.get('embedding') is None:
            continue
        score = cosine_similarity(query_embedding, chunk['embedding'])
        results.append((score, chunk))
    
    # Sort by similarity score
    results.sort(reverse=True, key=lambda x: x[0])
    
    # Return top results, deduplicated by record_id
    top_results = []
    seen_records = set()
    
    for score, chunk in results[:10]:  # Look at top 10 for deduplication
        record_id = chunk['metadata']['recordId']
        if record_id in seen_records:
            continue
        
        seen_records.add(record_id)
        top_results.append({
            'text': chunk['text'],
            'metadata': chunk['metadata'],
            'score': float(score)
        })
        
        if len(top_results) >= limit:
            break
    
    return top_results

@app.route('/process_record', methods=['POST'])
def process_record():
    """Process a medical record and store embeddings."""
    try:
        # Get record data
        record_data = json.loads(request.form.get('record_data'))
        file = request.files.get('file')
        
        if not file:
            return jsonify({"success": False, "message": "No file provided"}), 400
        
        # For simplicity, use description as text content
        description = record_data.get("description", "")
        title = record_data.get("title", "")
        extracted_text = f"{title}. {description}"
        
        # Generate summary using Gemini
        summary_prompt = f"""
        Please provide a brief medical summary of the following:
        {extracted_text}
        
        Focus on key medical details, diagnoses, treatments, and important values.
        Keep it under 200 words.
        """
        
        summary_response = generation_model.generate_content(summary_prompt)
        summary = summary_response.text
        
        # Create metadata
        metadata = {
            "title": record_data.get("title", ""),
            "description": record_data.get("description", ""),
            "recordType": record_data.get("recordType", ""),
            "recordDate": record_data.get("recordDate", ""),
            "userId": record_data.get("userId", ""),
            "recordId": record_data.get("recordId", ""),
            "textSummary": summary
        }
        
        # Chunk the text
        chunks = chunk_text(extracted_text)
        
        # Store chunks with embeddings
        chunk_ids = []
        user_id = record_data.get("userId")
        
        # Initialize user's chunks store if needed
        if user_id not in chunks_db:
            chunks_db[user_id] = []
        
        # Store each chunk
        for i, chunk_text in enumerate(chunks):
            chunk_id = f"{record_data.get('recordId')}_chunk_{i}"
            
            # Generate embedding
            embedding = generate_embedding(chunk_text)
            
            # Store chunk
            chunk_data = {
                'id': chunk_id,
                'text': chunk_text,
                'embedding': embedding,
                'metadata': {
                    **metadata,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }
            }
            
            chunks_db[user_id].append(chunk_data)
            chunk_ids.append(chunk_id)
        
        print(f"Processed record: {title}, user: {user_id}, chunks: {len(chunks)}")
        
        return jsonify({
            "success": True, 
            "message": "Record processed successfully",
            "chunk_ids": chunk_ids,
            "text_length": len(extracted_text),
            "chunks_count": len(chunks),
            "summary": summary
        })
        
    except Exception as e:
        print(f"Error processing record: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/query_records', methods=['POST'])
def query_records():
    """Get information from medical records based on a specific question."""
    try:
        data = request.json
        question = data.get('question')
        user_id = data.get('userId')
        
        if not question or not user_id:
            return jsonify({"success": False, "message": "Question and userId are required"}), 400
        
        # Generate embedding for the question
        query_embedding = generate_embedding(question)
        
        # TEMPORARY SOLUTION: Use hardcoded sample user ID for testing
        sample_user_id = "123456789"
        
        # Search for relevant chunks (using sample user id for testing)
        results = search_chunks(sample_user_id, query_embedding, limit=5)
        
        if not results:
            return jsonify({
                "success": True,
                "answer": "I couldn't find any relevant information in your medical records. Please try a different question or check if you have uploaded records related to this query."
            })
            
        # Combine relevant contexts
        contexts = []
        record_info = set()
        
        for result in results:
            text = result['text']
            metadata = result['metadata']
            
            title = metadata.get('title', '')
            record_type = metadata.get('recordType', '')
            record_date = metadata.get('recordDate', '')
            
            record_info.add(f"- {title} ({record_type}) from {record_date}")
            contexts.append(text)
        
        # Create prompt for Gemini
        context_text = "\n\n".join(contexts)
        record_info_text = "\n".join(record_info)
        
        prompt = f"""
        You are a medical assistant helping a patient understand their medical records.
        Below is information from the patient's medical records:

        {context_text}

        Based only on the information above, please answer this question:
        "{question}"

        Rules:
        1. Only use information from the provided medical records
        2. If the information is not in the records, say so
        3. Be clear and use patient-friendly language
        4. Keep the answer concise but informative
        5. If you're unsure about any details, express that uncertainty
        6. Do not make assumptions beyond what's in the records

        Referenced medical records:
        {record_info_text}
        """
        
        # Generate answer with Gemini
        response = generation_model.generate_content(prompt)
        answer = response.text
            
        return jsonify({
            "success": True,
            "answer": answer,
            "sources": list(record_info)
        })
        
    except Exception as e:
        print(f"Error querying records: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/debug/chunks', methods=['GET'])
def debug_chunks():
    """Debug endpoint to check chunks_db."""
    try:
        result = {}
        for user_id, chunks in chunks_db.items():
            result[user_id] = {
                'chunk_count': len(chunks),
                'sample': chunks[0] if chunks else None
            }
        return jsonify({
            "success": True,
            "data": result
        })
    except Exception as e:
        print(f"Error debugging chunks: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/debug/add_sample_data', methods=['GET'])
def add_sample_data_route():
    """Add sample medical record data for testing."""
    try:
        from test_add_data import add_sample_data
        result = add_sample_data()
        return jsonify(result)
    except Exception as e:
        print(f"Error adding sample data: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    # Add sample data
    try:
        print("Adding sample data...")
        # Sample user ID
        user_id = "123456789"
        
        # Sample medical records
        sample_records = [
            {
    "recordId": "sample_record_2",
    "title": "Outpatient Rheumatology Summary",
    "description": "Patient is a 56-year-old female with a known case of systemic lupus erythematosus and scleroderma overlap with interstitial lung disease on medication. Presenting with tightness of skin on the fists and ulcers on the pulp of the fingers. Treatment includes multiple medications such as Linezolid, Clopidogrel, Amlodipine, Domperidone, Omeprazole, Bosentan, Sildenafil Citrate, Prednisolone, Mycophenolate Mofetil, L-methylfolate calcium, and Ciprofloxacin. Review advised after 4 weeks.",
    "recordType": "Rheumatology Outpatient Summary",
    "recordDate": "2021-07-02",
    "patientName": "Ms Rukhsana Shaheen",
    "hospitalNo": "MH005990453",
    "episodeNo": "03000582270",
    "doctor": "Dr Darshan Singh Bhakuni",
    "department": "Rheumatology MHD",
    "ageSex": "56 yrs/Female",
    "consultationType": "Video consultation",
    
},

            {
                "recordId": "sample_record_1",
                "title": "Annual Physical Examination",
                "description": "Patient is a 45-year-old male in good health. Blood pressure: 120/80 mmHg. Heart rate: 72 bpm. Currently taking Lisinopril 10mg daily for hypertension and Metformin 500mg twice daily for type 2 diabetes. Lab results show normal kidney function, cholesterol within normal limits. Recommended follow-up in 12 months.",
                "recordType": "Physical Examination",
                "recordDate": "2023-03-15",
                "doctor_name": "Dr Darshan Singh Bhakuni",
                "hospital_name": "Medanta Hospital",
                "hospital_no": "MH005990453",
            
            },
            {
                "recordId": "sample_record_2",
                "title": "Cardiology Consultation",
                "description": "Patient referred for evaluation of chest pain. ECG shows normal sinus rhythm. Stress test was negative for ischemia. Echo shows normal ejection fraction of 60%. Recommended to continue current medications: Aspirin 81mg daily and Atorvastatin 20mg at bedtime. Advised to exercise regularly and follow a low-salt diet.",
                "recordType": "Specialist Consultation",
                "recordDate": "2023-05-20",
                "doctor_name": "Dr Darshan Singh Bhakuni",
                "hospital_name": "Medanta Hospital",
                "hospital_no": "MH005990453",
            
            },
            {
                "recordId": "sample_record_3",
                "title": "Lab Results",
                "description": "Complete Blood Count: WBC 6.5, RBC 4.8, Hemoglobin 14.2, Hematocrit 42%, Platelets 250. Comprehensive Metabolic Panel: Sodium 140, Potassium 4.2, Glucose 110 (slightly elevated), A1C 6.4%. Lipid Panel: Total Cholesterol 185, LDL 110, HDL 45, Triglycerides 150. Thyroid Function: TSH 2.8, within normal range.",
                "recordType": "Lab Report",
                "recordDate": "2023-06-10",
                "doctor_name": "Dr Darshan Singh Bhakuni",
                "hospital_name": "Medanta Hospital",
                "hospital_no": "MH005990453",
            }
        ]
        
        # Initialize user's chunks store
        chunks_db[user_id] = []
        
        total_chunks = 0
        
        for record in sample_records:
            # Create full text
            full_text = f"{record['title']}. {record['description']}"
            
            # Chunk text
            chunks = chunk_text(full_text)
            total_chunks += len(chunks)
            
            # Create metadata
            metadata = {
                "recordId": record["recordId"],
                "title": record["title"],
                "description": record["description"],
                "recordType": record["recordType"],
                "recordDate": record["recordDate"]
            }
            
            # Store chunks with embeddings
            for i, chunk_text_content in enumerate(chunks):
                chunk_id = f"{record['recordId']}_chunk_{i}"
                
                # Generate embedding
                embedding = generate_embedding(chunk_text_content)
                
                # Store chunk
                chunk_data = {
                    'id': chunk_id,
                    'text': chunk_text_content,
                    'embedding': embedding,
                    'metadata': {
                        **metadata,
                        "chunk_index": i,
                        "total_chunks": len(chunks)
                    }
                }
                
                chunks_db[user_id].append(chunk_data)
        
        print(f"Added {len(sample_records)} sample records with {total_chunks} chunks for user {user_id}")
        
    except Exception as e:
        print(f"Error adding sample data: {str(e)}")
    
    # Start the server
    app.run(debug=True, port=5000) 
```

### python_server\rag_server.py
```
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import io
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from groclake.vectorlake import VectorLake
from groclake.modellake import ModelLake

app = Flask(__name__)
CORS(app)

# Initialize API keys
os.environ['GROCLAKE_API_KEY'] = '43ec517d68b6edd3015b3edc9a11367b'
os.environ['GROCLAKE_ACCOUNT_ID'] = '7376846f01e0b6e5f1568fef7b48a148'
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyBpwbZVpuwYwKA_F3A-bEEhvTHYjoTUIgE')

# Initialize lakes
vectorlake = VectorLake()
modellake = ModelLake()

def extract_text_from_pdf(pdf_bytes):
    """Extract text from PDF file bytes."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
        return ""

def extract_text_from_image(image_bytes):
    """Extract text from image using OCR."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        print(f"Error extracting text from image: {str(e)}")
        return ""

def clean_text(text):
    """Clean extracted text."""
    # Remove excessive whitespace
    text = " ".join(text.split())
    # Remove non-printable characters
    text = "".join(char for char in text if char.isprintable())
    return text

def chunk_text(text, chunk_size=1000, overlap=200):
    """Split text into chunks with overlap."""
    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size
        # If this is not the first chunk, start a bit earlier to create overlap
        if start > 0:
            start = max(0, start - overlap)
        # If this is the last chunk, just go to the end
        if end >= text_len:
            chunks.append(text[start:])
            break
        # Find the last period or newline to break at a natural point
        last_period = text.rfind('.', start, end)
        last_newline = text.rfind('\n', start, end)
        break_point = max(last_period, last_newline)
        if break_point > start:
            end = break_point + 1
        chunks.append(text[start:end])
        start = end

    return chunks

@app.route('/process_record', methods=['POST'])
def process_record():
    """Process a medical record and store vectors in VectorLake."""
    try:
        # Get record data and file
        record_data = json.loads(request.form.get('record_data'))
        file = request.files.get('file')
        
        if not file:
            return jsonify({"success": False, "message": "No file provided"}), 400
        
        # Extract text based on file type
        file_bytes = file.read()
        file_ext = file.filename.split('.')[-1].lower()
        
        if file_ext == 'pdf':
            extracted_text = extract_text_from_pdf(file_bytes)
        elif file_ext in ['jpg', 'jpeg', 'png']:
            extracted_text = extract_text_from_image(file_bytes)
        else:
            return jsonify({"success": False, "message": "Unsupported file type"}), 400
        
        # Clean the extracted text
        extracted_text = clean_text(extracted_text)
        
        if not extracted_text:
            return jsonify({"success": False, "message": "No text could be extracted from the file"}), 400
        
        # Generate summary using ModelLake
        summary_prompt = f"""
        Please provide a brief medical summary of the following text from a {record_data.get('recordType', '')}:
        {extracted_text[:3000]}...
        
        Focus on key medical details, diagnoses, treatments, and important values.
        Keep it under 200 words.
        """
        
        summary_response = modellake.complete({
            "prompt": summary_prompt,
            "token_size": 500
        })
        summary = summary_response.get("text", "")
        
        # Create metadata
        metadata = {
            "title": record_data.get("title", ""),
            "description": record_data.get("description", ""),
            "recordType": record_data.get("recordType", ""),
            "recordDate": record_data.get("recordDate", ""),
            "userId": record_data.get("userId", ""),
            "recordId": record_data.get("recordId", ""),
            "textSummary": summary
        }
        
        # Chunk the text
        chunks = chunk_text(extracted_text)
        
        # Store chunks in VectorLake
        vector_ids = []
        user_id = record_data.get("userId")
        vector_namespace = f"medical_records_{user_id}"
        
        # Create vector namespace for the user if it doesn't exist
        try:
            vectorlake.create({
                "name": vector_namespace,
                "type": "text"
            })
        except Exception as e:
            # Vector namespace may already exist
            print(f"Vector namespace exists or error: {str(e)}")
        
        # Store each chunk
        for i, chunk in enumerate(chunks):
            chunk_id = f"{record_data.get('recordId')}_chunk_{i}"
            
            try:
                # Generate and store vector
                vectorlake.store({
                    "id": chunk_id,
                    "vector_name": vector_namespace,
                    "vector_document": chunk,
                    "metadata": {
                        **metadata,
                        "chunk_index": i,
                        "total_chunks": len(chunks)
                    }
                })
                vector_ids.append(chunk_id)
            except Exception as e:
                print(f"Error storing vector for chunk {i}: {str(e)}")
        
        return jsonify({
            "success": True, 
            "message": "Record processed successfully",
            "vector_ids": vector_ids,
            "text_length": len(extracted_text),
            "chunks_count": len(chunks),
            "summary": summary
        })
        
    except Exception as e:
        print(f"Error processing record: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/query_records', methods=['POST'])
def query_records():
    """Get information from medical records based on a specific question."""
    try:
        data = request.json
        question = data.get('question')
        user_id = data.get('userId')
        
        if not question or not user_id:
            return jsonify({"success": False, "message": "Question and userId are required"}), 400
        
        # Search in VectorLake
        vector_namespace = f"medical_records_{user_id}"
        
        try:
            search_results = vectorlake.search({
                "query": question,
                "vector_name": vector_namespace,
                "limit": 5
            })
            results = search_results.get("results", [])
        except Exception as e:
            print(f"Error searching vectors: {str(e)}")
            return jsonify({"success": False, "message": f"Error searching records: {str(e)}"}), 500
        
        if not results:
            return jsonify({
                "success": True,
                "answer": "I couldn't find any relevant information in your medical records. Please try a different question or check if you have uploaded records related to this query."
            })
            
        # Combine relevant contexts
        contexts = []
        record_info = set()
        
        for result in results:
            text = result.get("vector_document", "")
            metadata = result.get("metadata", {})
            
            title = metadata.get('title', '')
            record_type = metadata.get('recordType', '')
            record_date = metadata.get('recordDate', '')
            
            record_info.add(f"- {title} ({record_type}) from {record_date}")
            contexts.append(text)
        
        # Create prompt for ModelLake
        context_text = "\n\n".join(contexts)
        record_info_text = "\n".join(record_info)
        
        prompt = f"""
        You are a medical assistant helping a patient understand their medical records.
        Below is information from the patient's medical records:

        {context_text}

        Based only on the information above, please answer this question:
        "{question}"

        Rules:
        1. Only use information from the provided medical records
        2. If the information is not in the records, say so
        3. Be clear and use patient-friendly language
        4. Keep the answer concise but informative
        5. If you're unsure about any details, express that uncertainty
        6. Do not make assumptions beyond what's in the records

        Referenced medical records:
        {record_info_text}
        """
        
        # Generate answer with ModelLake
        response = modellake.complete({
            "prompt": prompt,
            "token_size": 2000
        })
        
        answer = response.get("text", "I'm sorry, I couldn't generate a proper response.")
            
        return jsonify({
            "success": True,
            "answer": answer,
            "sources": list(record_info)
        })
        
    except Exception as e:
        print(f"Error querying records: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 
```

### python_server\simple_rag.py
```
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import google.generativeai as genai
from groclake.vectorlake import VectorLake
from groclake.modellake import ModelLake

app = Flask(__name__)
CORS(app)

# Initialize API keys
os.environ['GROCLAKE_API_KEY'] = '43ec517d68b6edd3015b3edc9a11367b'
os.environ['GROCLAKE_ACCOUNT_ID'] = '7376846f01e0b6e5f1568fef7b48a148'
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyBpwbZVpuwYwKA_F3A-bEEhvTHYjoTUIgE')

# Initialize lakes
vectorlake = VectorLake()
modellake = ModelLake()

def chunk_text(text, chunk_size=1000, overlap=200):
    """Split text into chunks with overlap."""
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        if len(chunk) > 100:  # Only add chunks with substantial text
            chunks.append(chunk)
    return chunks

@app.route('/process_record', methods=['POST'])
def process_record():
    """Process a medical record and store vectors in VectorLake."""
    try:
        # Get record data
        record_data = json.loads(request.form.get('record_data'))
        file = request.files.get('file')
        
        if not file:
            return jsonify({"success": False, "message": "No file provided"}), 400
        
        # For simplicity, we'll just use the description as text content
        # In a production app, you'd extract text from PDFs or use OCR for images
        description = record_data.get("description", "")
        title = record_data.get("title", "")
        extracted_text = f"{title}. {description}"
        
        # Generate summary using ModelLake
        summary_prompt = f"""
        Please provide a brief medical summary of the following:
        {extracted_text}
        
        Focus on key medical details, diagnoses, treatments, and important values.
        Keep it under 200 words.
        """
        
        summary_response = modellake.complete({
            "prompt": summary_prompt,
            "token_size": 500
        })
        summary = summary_response.get("text", "")
        
        # Create metadata
        metadata = {
            "title": record_data.get("title", ""),
            "description": record_data.get("description", ""),
            "recordType": record_data.get("recordType", ""),
            "recordDate": record_data.get("recordDate", ""),
            "userId": record_data.get("userId", ""),
            "recordId": record_data.get("recordId", ""),
            "textSummary": summary
        }
        
        # Chunk the text
        chunks = chunk_text(extracted_text)
        
        # Store chunks in VectorLake
        vector_ids = []
        user_id = record_data.get("userId")
        vector_namespace = f"medical_records_{user_id}"
        
        # Create vector namespace for the user if it doesn't exist
        try:
            vectorlake.create({
                "name": vector_namespace,
                "type": "text"
            })
        except Exception as e:
            # Vector namespace may already exist
            print(f"Vector namespace exists or error: {str(e)}")
        
        # Store each chunk
        for i, chunk in enumerate(chunks):
            chunk_id = f"{record_data.get('recordId')}_chunk_{i}"
            
            try:
                # Generate and store vector
                vectorlake.store({
                    "id": chunk_id,
                    "vector_name": vector_namespace,
                    "vector_document": chunk,
                    "metadata": {
                        **metadata,
                        "chunk_index": i,
                        "total_chunks": len(chunks)
                    }
                })
                vector_ids.append(chunk_id)
            except Exception as e:
                print(f"Error storing vector for chunk {i}: {str(e)}")
        
        return jsonify({
            "success": True, 
            "message": "Record processed successfully",
            "vector_ids": vector_ids,
            "text_length": len(extracted_text),
            "chunks_count": len(chunks),
            "summary": summary
        })
        
    except Exception as e:
        print(f"Error processing record: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/query_records', methods=['POST'])
def query_records():
    """Get information from medical records based on a specific question."""
    try:
        data = request.json
        question = data.get('question')
        user_id = data.get('userId')
        
        if not question or not user_id:
            return jsonify({"success": False, "message": "Question and userId are required"}), 400
        
        # Search in VectorLake
        vector_namespace = f"medical_records_{user_id}"
        
        try:
            search_results = vectorlake.search({
                "query": question,
                "vector_name": vector_namespace,
                "limit": 5
            })
            results = search_results.get("results", [])
        except Exception as e:
            print(f"Error searching vectors: {str(e)}")
            return jsonify({"success": False, "message": f"Error searching records: {str(e)}"}), 500
        
        if not results:
            return jsonify({
                "success": True,
                "answer": "I couldn't find any relevant information in your medical records. Please try a different question or check if you have uploaded records related to this query."
            })
            
        # Combine relevant contexts
        contexts = []
        record_info = set()
        
        for result in results:
            text = result.get("vector_document", "")
            metadata = result.get("metadata", {})
            
            title = metadata.get('title', '')
            record_type = metadata.get('recordType', '')
            record_date = metadata.get('recordDate', '')
            
            record_info.add(f"- {title} ({record_type}) from {record_date}")
            contexts.append(text)
        
        # Create prompt for ModelLake
        context_text = "\n\n".join(contexts)
        record_info_text = "\n".join(record_info)
        
        prompt = f"""
        You are a medical assistant helping a patient understand their medical records.
        Below is information from the patient's medical records:

        {context_text}

        Based only on the information above, please answer this question:
        "{question}"

        Rules:
        1. Only use information from the provided medical records
        2. If the information is not in the records, say so
        3. Be clear and use patient-friendly language
        4. Keep the answer concise but informative
        5. If you're unsure about any details, express that uncertainty
        6. Do not make assumptions beyond what's in the records

        Referenced medical records:
        {record_info_text}
        """
        
        # Generate answer with ModelLake
        response = modellake.complete({
            "prompt": prompt,
            "token_size": 2000
        })
        
        answer = response.get("text", "I'm sorry, I couldn't generate a proper response.")
            
        return jsonify({
            "success": True,
            "answer": answer,
            "sources": list(record_info)
        })
        
    except Exception as e:
        print(f"Error querying records: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 
```

### python_server\__pycache__\gemini_rag.cpython-310.pyc
```
o
    �g(  �                   @   s"  d dl mZmZmZ d dlmZ d dlZd dlZd dlm	Z
 d dlZee�Zee� ej�dd�Ze
jed� e
�d�ZeZi Zdd	� Zd
d� Zd&dd�Zd'dd�Zejddgd�dd� �Zejddgd�dd� �Zejddgd�dd� �Zejddgd�d d!� �Zed"kr�ej d#d$d%� dS dS )(�    )�Flask�request�jsonify)�CORSN�GEMINI_API_KEYz'AIzaSyBpwbZVpuwYwKA_F3A-bEEhvTHYjoTUIgE)�api_keyzgemini-1.5-flashc           	   
   C   s�   z:d| � d�}t �|�}|j�d�}t�d�}t|dd� �D ]
\}}d||d < qtj�|�}|dkr8|| }|W S  t	yZ } zt
dt|�� �� t�d�W  Y d}~S d}~ww )	z7Generate pseudo-embedding using Gemini model responses.z�
        Extract 20 key medical terms or concepts from the following text, separated by commas.
        If there are fewer than 20 terms, just extract what's available.
        TEXT: �	
        �,�d   N�   r   zError generating embedding: )�generation_model�generate_content�text�split�np�zeros�	enumerate�linalg�norm�	Exception�print�str)	r   �prompt�result�terms�terms_vector�i�termr   �e� r   �</home/ayush/Desktop/TinkHack-2.0/python_server/gemini_rag.py�generate_embedding   s$   �

��r!   c                 C   s$   t �| |�t j�| �t j�|�  S )z0Calculate cosine similarity between two vectors.)r   �dotr   r   )�a�br   r   r    �cosine_similarity4   s   $r%   ��  ��   c                 C   sH   g }t dt| �|| �D ]}| ||| � }t|�dkr!|�|� q|S )z$Split text into chunks with overlap.r   r
   )�range�len�append)r   �
chunk_size�overlap�chunksr   �chunkr   r   r    �
chunk_text8   s   
�r/   �   c           	      C   s�   | t vst |  s
g S g }t |  D ]}|�d�du rqt||d �}|�||f� q|jddd� d� g }t� }|dd� D ],\}}|d d	 }||v rLq=|�|� |�|d
 |d t|�d�� t|�|kri |S q=|S )zSearch for relevant chunks.�	embeddingNTc                 S   s   | d S )Nr   r   )�xr   r   r    �<lambda>N   s    zsearch_chunks.<locals>.<lambda>)�reverse�key�
   �metadata�recordIdr   )r   r7   �score)	�	chunks_db�getr%   r*   �sort�set�add�floatr)   )	�user_id�query_embedding�limit�resultsr.   r9   �top_results�seen_records�	record_idr   r   r    �search_chunksA   s4   
��rG   z/process_record�POST)�methodsc               
   C   s�  z�t �tj�d��} tj�d�}|stddd��dfW S | �dd�}| �d	d�}|� d
|� �}d|� d�}t�|�}|j	}| �d	d�| �dd�| �dd�| �dd�| �dd�| �dd�|d�}|	|�}
g }| �d�}|t
vrrg t
|< t|
�D ].\}}	| �d�� d|� �}t|	�}||	|i |�|t|
�d��d�}t
| �|� |�|� qvtd|� d|� dt|
�� �� tdd|t|�t|
�|d��W S  ty� } ztdt|�� �� tdt|�d��dfW  Y d}~S d}~ww )z.Process a medical record and store embeddings.�record_data�fileFzNo file provided��success�message�  �description� �titlez. zJ
        Please provide a brief medical summary of the following:
        z�
        
        Focus on key medical details, diagnoses, treatments, and important values.
        Keep it under 200 words.
        �
recordType�
recordDate�userIdr8   )rR   rP   rS   rT   rU   r8   �textSummary�_chunk_)�chunk_index�total_chunks)�idr   r1   r7   zProcessed record: z, user: z
, chunks: TzRecord processed successfully)rM   rN   �	chunk_ids�text_length�chunks_count�summaryzError processing record: ��  N)�json�loadsr   �formr;   �filesr   r   r   r   r:   r   r!   r)   r*   r   r   r   )rJ   rK   rP   rR   �extracted_text�summary_prompt�summary_responser^   r7   r/   r-   r[   r@   r   �chunk_idr1   �
chunk_datar   r   r   r    �process_recorde   sn   �






�
���
�	"��ri   z/query_recordsc               
   C   sn  z�t j} | �d�}| �d�}|r|stddd��dfW S t|�}t||dd�}|s1td	d
d��W S g }t� }|D ]/}|d }|d }	|	�dd�}
|	�dd�}|	�dd�}|�d|
� d|� d|� �� |�|� q8d�	|�}d�	|�}d|� d|� d|� d�}t
�|�}|j}td	|t|�d��W S  ty� } ztdt|�� �� tdt|�d��dfW  Y d}~S d}~ww )zBGet information from medical records based on a specific question.�questionrU   Fz Question and userId are requiredrL   rO   r0   )rB   Tz�I couldn't find any relevant information in your medical records. Please try a different question or check if you have uploaded records related to this query.)rM   �answerr   r7   rR   rQ   rS   rT   z- z (z) from z

�
z�
        You are a medical assistant helping a patient understand their medical records.
        Below is information from the patient's medical records:

        zU

        Based only on the information above, please answer this question:
        "a�  "

        Rules:
        1. Only use information from the provided medical records
        2. If the information is not in the records, say so
        3. Be clear and use patient-friendly language
        4. Keep the answer concise but informative
        5. If you're unsure about any details, express that uncertainty
        6. Do not make assumptions beyond what's in the records

        Referenced medical records:
        r   )rM   rk   �sourceszError querying records: r_   N)r   r`   r;   r   r!   rG   r=   r>   r*   �joinr   r   r   �listr   r   r   )�datarj   r@   rA   rC   �contexts�record_infor   r   r7   rR   �record_type�record_date�context_text�record_info_textr   �responserk   r   r   r   r    �query_records�   sX   


�

���

�"��rx   z/debug/chunks�GETc               
   C   s�   z"i } t �� D ]\}}t|�|r|d ndd�| |< qtd| d��W S  tyH } ztdt|�� �� tdt|�d��d	fW  Y d}~S d}~ww )
z"Debug endpoint to check chunks_db.r   N)�chunk_count�sampleT)rM   rp   zError debugging chunks: FrL   r_   )r:   �itemsr)   r   r   r   r   )r   r@   r-   r   r   r   r    �debug_chunks	  s   �
�"��r}   z/debug/add_sample_datac               
   C   sj   zddl m}  | � }t|�W S  ty4 } ztdt|�� �� tdt|�d��dfW  Y d}~S d}~ww )z+Add sample medical record data for testing.r   )�add_sample_datazError adding sample data: FrL   r_   N)�test_add_datar~   r   r   r   r   )r~   r   r   r   r   r    �add_sample_data_route  s   
"��r�   �__main__Ti�  )�debug�port)r&   r'   )r0   )!�flaskr   r   r   �
flask_corsr   �osr`   �google.generativeai�generativeai�genai�numpyr   �__name__�app�environr;   r   �	configure�GenerativeModelr   �embedding_modelr:   r!   r%   r/   rG   �routeri   rx   r}   r�   �runr   r   r   r    �<module>   s8    


	$
V
L


�
```

### python_server\__pycache__\test_add_data.cpython-310.pyc
```
o
    ��g�  �                   @   s>   d dl mZmZmZmZ d dlZdd� Zedkre�  dS dS )�    )�app�generate_embedding�
chunk_text�	chunks_dbNc               	   C   s6  d} dddddd�dd	d
ddd�dddddd�g}| t vr!g t | < d}|D ]V}|d � d|d � �}t|�}|t|�7 }|d |d |d |d |d d�}t|�D ](\}}|d � d|� �}	t|�}
|	||
i |�|t|�d��d�}t |  �|� qRq%tdt|�� d|� d| � �� ddt|�� d|� d| � �d �S )!N�	123456789�sample_record_1zAnnual Physical Examinationa:  Patient is a 45-year-old male in good health. Blood pressure: 120/80 mmHg. Heart rate: 72 bpm. Currently taking Lisinopril 10mg daily for hypertension and Metformin 500mg twice daily for type 2 diabetes. Lab results show normal kidney function, cholesterol within normal limits. Recommended follow-up in 12 months.zPhysical Examinationz
2023-03-15)�recordId�title�description�
recordType�
recordDate�sample_record_2zCardiology Consultationa<  Patient referred for evaluation of chest pain. ECG shows normal sinus rhythm. Stress test was negative for ischemia. Echo shows normal ejection fraction of 60%. Recommended to continue current medications: Aspirin 81mg daily and Atorvastatin 20mg at bedtime. Advised to exercise regularly and follow a low-salt diet.zSpecialist Consultationz
2023-05-20�sample_record_3zLab Resultsa4  Complete Blood Count: WBC 6.5, RBC 4.8, Hemoglobin 14.2, Hematocrit 42%, Platelets 250. Comprehensive Metabolic Panel: Sodium 140, Potassium 4.2, Glucose 110 (slightly elevated), A1C 6.4%. Lipid Panel: Total Cholesterol 185, LDL 110, HDL 45, Triglycerides 150. Thyroid Function: TSH 2.8, within normal range.z
Lab Reportz
2023-06-10r   r	   z. r
   r   r   r   �_chunk_)�chunk_index�total_chunks)�id�text�	embedding�metadatazAdded z sample records with z chunks for user T)�success�message)r   r   �len�	enumerater   �append�print)�user_id�sample_recordsr   �record�	full_text�chunksr   �i�chunk_text_content�chunk_idr   �
chunk_data� r%   �?/home/ayush/Desktop/TinkHack-2.0/python_server/test_add_data.py�add_sample_data   sd   �����	���� r'   �__main__)�
gemini_ragr   r   r   r   �jsonr'   �__name__r%   r%   r%   r&   �<module>   s    L
�
```

### README.md
```
# Healthcare Platform

A comprehensive healthcare platform that connects patients with navigators and caregivers, facilitating medical record management and health risk assessments.

## Features

### Patient Features:

- **Dashboard**: View health risk assessment, upcoming appointments, and care team information
- **Medical Records**: Upload, view, update, and delete medical records
  - Filter by record type
  - Search functionality using AI-powered semantic search
- **Baseline Health Screening**: Complete comprehensive health assessment
  - AI-powered risk stratification using Google's Gemini 1.5 Flash
  - Analysis of medication history, personal health history, family history, and social determinants of health

### Navigator & Caregiver Features

- **Dashboard**: View assigned patients and relevant information

## Technology Stack:

- **Frontend**: HTML, CSS, JavaScript, EJS templating, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js
- **File Storage**: Cloudinary for medical record file storage
- **AI Integration**: Google Gemini 1.5 Flash for health risk assessment and record search

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- Cloudinary account
- Google AI API key for Gemini

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/healthcare-platform.git
   cd healthcare-platform
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Set up environment variables
   Copy `.env.example` to `.env` and fill in your details:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/healthcare
   SESSION_SECRET=your_session_secret

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the application

   ```
   npm start
   ```

5. Visit `http://localhost:3000` in your browser

## Project Structure

```
├── config/             # Configuration files
├── middleware/         # Express middleware
├── models/             # Mongoose models
├── public/             # Static assets
├── routes/             # Express routes
├── utils/              # Utility functions
├── views/              # EJS templates
│   ├── pages/          # Page templates
│   └── partials/       # Reusable template parts
├── .env                # Environment variables
├── app.js              # Application entry point
└── package.json        # Project metadata
```

## Key Features Explained

### Baseline Health Screening

The baseline screening feature collects comprehensive health information from patients including:

1. **Medication & Drug History**

   - Current medications
   - Medication allergies
   - Recreational drug use

2. **Personal Health History**

   - Chronic conditions
   - Past surgeries and hospitalizations
   - Mental health conditions

3. **Family Health History**

   - Predisposition to various conditions
   - Family medical background

4. **Social Determinants of Health (SDOH)**
   - Race/ethnicity
   - Education level
   - Housing situation
   - Healthcare access
   - Employment status
   - Food security
   - Transportation access
   - Social support network

This data is analyzed using Google's Gemini AI to provide a risk assessment categorizing patients into Low, Medium, or High risk levels, along with potential health concerns and recommendations.

### Medical Records Management

- **Upload**: Patients can upload various types of medical records with detailed metadata
- **Update/Delete**: Full CRUD functionality for managing records
- **Filter & Search**: AI-powered semantic search helps find relevant records
- **Security**: All records are securely stored and accessible only to authorized users

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Bootstrap for UI components
- Cloudinary for file storage
- Google for Gemini AI API

```

### utils\gemini.js
```
const { GoogleGenerativeAI } = require("@google/generative-ai");
const MedicalRecord = require("../models/medicalRecord");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelText = genAI.getGenerativeModel({ model: "gemini-pro" });
const modelEmbedding = genAI.getGenerativeModel({ model: "embedding-001" });

/**
 * Generate embedding vector for text using Gemini
 * @param {string} text - Text to generate embedding for
 * @returns {Array} - Embedding vector
 */
async function generateEmbedding(text) {
  try {
    const result = await modelEmbedding.embedContent(text);
    const embedding = result.embedding.values;
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {number} - Similarity score between 0 and 1
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Search medical records using semantic search
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @returns {Array} - Search results with scores and explanations
 */
async function searchRecords(query, userId) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Get all records for the user
    const records = await MedicalRecord.find({
      patient: userId,
      vectorEmbedding: { $exists: true, $ne: null },
    });

    // Calculate similarity scores
    const scoredRecords = records.map((record) => {
      const score = cosineSimilarity(queryEmbedding, record.vectorEmbedding);
      return { record, score };
    });

    // Sort by similarity and get top results (score > 0.7)
    const filteredResults = scoredRecords
      .filter((item) => item.score > 0.7)
      .sort((a, b) => b.score - a.score);

    // Get explanations for top 5 results
    const topResults = filteredResults.slice(0, 5);

    if (topResults.length === 0) {
      // If no high-similarity results, return top 3 records regardless of score
      return scoredRecords.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    // Generate explanations for the top results
    const resultsWithExplanations = await Promise.all(
      topResults.map(async ({ record, score }) => {
        try {
          const prompt = `
            You are analyzing a medical record that matched a search query.
            
            Medical record title: "${record.title}"
            Medical record description: "${record.description}"
            Medical record type: "${record.recordType}"
            
            Search query: "${query}"
            
            In 1-2 sentences, explain why this medical record is relevant to the search query.
            Be specific and mention any medical terms or concepts that connect the query to the record.
            Keep your explanation concise and medical-focused.
          `;

          const result = await modelText.generateContent(prompt);
          const explanation = result.response.text();

          return {
            record,
            score,
            explanation,
          };
        } catch (error) {
          console.error("Error generating explanation:", error);
          return { record, score };
        }
      })
    );

    return resultsWithExplanations;
  } catch (error) {
    console.error("Error searching records:", error);
    throw error;
  }
}

module.exports = {
  generateEmbedding,
  searchRecords,
};

```

### views\pages\auth\login.ejs
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MedConnect - Login</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      rel="stylesheet"
    />
    <link
      href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
    />
    <style>
      :root {
        --primary-blue: #2a5c82;
        --secondary-blue: #5c9baf;
        --accent-teal: #4ecdc4;
        --accent-purple: #b66dff;
        --warm-pink: #ff7e92;
        --soft-peach: #fff0f3;
        --light-teal: #e0f7fa;
        --dark-blue: #1a3c62;
      }

      body {
        background-image: url("https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80");
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        min-height: 100vh;
        font-family: "Poppins", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        position: relative;
        color: #333;
      }

      body::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          135deg,
          rgba(42, 92, 130, 0.9) 0%,
          rgba(92, 155, 175, 0.8) 100%
        );
        z-index: -1;
      }

      .medical-header {
        background: rgba(42, 92, 130, 0.95);
        padding: 1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .main-container {
        display: flex;
        min-height: calc(100vh - 76px);
        align-items: center;
        padding: 2rem 0;
        position: relative;
        z-index: 1;
      }

      /* Floating particles */
      .particles {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: -1;
        overflow: hidden;
      }

      .particle {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        animation: float 15s infinite ease-in-out;
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(0) translateX(0);
        }
        25% {
          transform: translateY(-30px) translateX(15px);
        }
        50% {
          transform: translateY(-15px) translateX(-15px);
        }
        75% {
          transform: translateY(30px) translateX(-30px);
        }
      }

      .image-side {
        padding: 2rem;
      }

      .image-side img {
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
        max-width: 100%;
        height: auto;
        transition: all 0.5s ease;
        transform: perspective(1000px) rotateY(-5deg);
        border: 8px solid white;
      }

      .image-side img:hover {
        transform: perspective(1000px) rotateY(0deg) translateY(-10px);
        box-shadow: 0 30px 50px rgba(0, 0, 0, 0.3);
      }

      .form-container {
        background: rgba(255, 255, 255, 0.97);
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        transition: all 0.4s ease;
        max-width: 500px;
        margin: 0 auto;
        overflow: hidden;
        position: relative;
        backdrop-filter: blur(10px);
        transform: perspective(1000px) rotateY(5deg);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .form-container:hover {
        transform: perspective(1000px) rotateY(0deg) translateY(-10px);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
      }

      .btn-medical {
        background: var(--accent-teal);
        color: white;
        padding: 12px 30px;
        transition: all 0.4s ease;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        letter-spacing: 0.5px;
        position: relative;
        overflow: hidden;
        z-index: 1;
        box-shadow: 0 5px 15px rgba(76, 205, 196, 0.3);
      }

      .btn-medical::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent
        );
        transition: all 0.4s ease;
        z-index: -1;
      }

      .btn-medical:hover::before {
        left: 100%;
      }

      .btn-medical:hover {
        background: var(--secondary-blue);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(76, 205, 196, 0.4);
      }

      .btn-medical:active {
        transform: translateY(1px);
      }

      .decorative-wave {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 150px;
        background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg"><path fill="%232A5C82" fill-opacity="0.1" d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,101.3C672,85,768,107,864,138.7C960,171,1056,213,1152,208C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
        z-index: -1;
      }

      .form-header {
        background: linear-gradient(
          135deg,
          var(--primary-blue),
          var(--secondary-blue)
        );
        color: white;
        padding: 25px 20px;
        margin: -20px -20px 20px -20px;
        border-radius: 20px 20px 0 0;
        position: relative;
        text-align: center;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }

      .form-header::after {
        content: "";
        position: absolute;
        bottom: -10px;
        left: calc(50% - 10px);
        width: 20px;
        height: 20px;
        background: var(--secondary-blue);
        transform: rotate(45deg);
      }

      .form-header img {
        display: block;
        margin: 0 auto 15px auto;
        width: 80px;
        filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2));
        animation: float 5s infinite ease-in-out;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.5);
        background: white;
        padding: 5px;
      }

      .input-group {
        border-radius: 50px;
        overflow: hidden;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
        margin-bottom: 20px;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      .input-group:focus-within {
        box-shadow: 0 5px 15px rgba(76, 205, 196, 0.2);
        transform: translateY(-2px);
      }

      .input-group-text {
        background-color: #f8f9fa;
        border: none;
        width: 50px;
        display: flex;
        justify-content: center;
        border-right: 1px solid rgba(0, 0, 0, 0.1);
        color: var(--primary-blue);
      }

      .form-control,
      .form-select {
        border: none;
        padding: 12px 15px;
        font-size: 0.95rem;
        background-color: #fff;
      }

      input:focus,
      select:focus {
        border-color: var(--accent-teal) !important;
        box-shadow: none !important;
        outline: none !important;
      }

      .form-label {
        font-weight: 500;
        color: var(--dark-blue);
        margin-bottom: 8px;
        font-size: 0.9rem;
      }

      .create-account-link {
        color: var(--accent-teal);
        font-weight: 600;
        transition: all 0.3s ease;
        text-decoration: none;
        position: relative;
        padding-bottom: 2px;
      }

      .create-account-link::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: var(--accent-teal);
        transition: width 0.3s ease;
      }

      .create-account-link:hover::after {
        width: 100%;
      }

      .create-account-link:hover {
        color: var(--primary-blue);
      }

      /* Support ribbon */
      .support-ribbon {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: linear-gradient(135deg, var(--warm-pink), #ff5c7f);
        color: white;
        padding: 12px 20px;
        border-radius: 50px;
        box-shadow: 0 10px 20px rgba(255, 126, 146, 0.4);
        z-index: 100;
        animation: pulse 2s infinite;
        font-weight: 600;
        font-size: 0.9rem;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 5px 15px rgba(255, 126, 146, 0.4);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 10px 25px rgba(255, 126, 146, 0.6);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 5px 15px rgba(255, 126, 146, 0.4);
        }
      }

      /* Floating cancer awareness icons */
      .floating-icon {
        position: absolute;
        opacity: 0.15;
        z-index: -1;
        filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.1));
      }

      .icon-1 {
        top: 20%;
        left: 10%;
        animation: floating 8s infinite ease-in-out;
      }

      .icon-2 {
        top: 40%;
        right: 10%;
        animation: floating 12s infinite ease-in-out;
      }

      .icon-3 {
        bottom: 25%;
        left: 20%;
        animation: floating 10s infinite ease-in-out;
      }

      @keyframes floating {
        0% {
          transform: translateY(0px) rotate(0deg) scale(1);
          opacity: 0.1;
        }
        50% {
          transform: translateY(-20px) rotate(10deg) scale(1.1);
          opacity: 0.2;
        }
        100% {
          transform: translateY(0px) rotate(0deg) scale(1);
          opacity: 0.1;
        }
      }

      /* Testimonial styles */
      .testimonial {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: 25px;
        margin-top: 20px;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        overflow: hidden;
      }

      .testimonial::before {
        content: "\f10d";
        font-family: "Font Awesome 5 Free";
        font-weight: 900;
        position: absolute;
        top: -15px;
        left: -10px;
        font-size: 6rem;
        color: rgba(76, 205, 196, 0.1);
        z-index: 0;
      }

      .testimonial-avatar {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid var(--accent-teal);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }

      .testimonial-content {
        position: relative;
        z-index: 1;
      }

      /* Responsive adjustments */
      @media (max-width: 991.98px) {
        .image-side {
          margin-bottom: 2rem;
        }
        .main-container {
          flex-direction: column;
        }
      }
    </style>
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <!-- Dynamic particles -->
    <div class="particles">
      <div
        class="particle"
        style="
          width: 15px;
          height: 15px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 20px;
          height: 20px;
          top: 30%;
          left: 25%;
          animation-delay: 1s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 10px;
          height: 10px;
          top: 50%;
          left: 15%;
          animation-delay: 2s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 25px;
          height: 25px;
          top: 65%;
          left: 70%;
          animation-delay: 3s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 12px;
          height: 12px;
          top: 80%;
          left: 50%;
          animation-delay: 4s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 18px;
          height: 18px;
          top: 15%;
          left: 60%;
          animation-delay: 5s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 15px;
          height: 15px;
          top: 40%;
          left: 80%;
          animation-delay: 6s;
        "
      ></div>
    </div>

    <!-- Floating cancer awareness icons -->
    <div class="floating-icon icon-1">
      <i class="fas fa-ribbon fa-4x" style="color: var(--warm-pink)"></i>
    </div>
    <div class="floating-icon icon-2">
      <i class="fas fa-heart fa-4x" style="color: var(--accent-purple)"></i>
    </div>
    <div class="floating-icon icon-3">
      <i
        class="fas fa-hand-holding-heart fa-4x"
        style="color: var(--accent-teal)"
      ></i>
    </div>

    <nav class="navbar medical-header">
      <div class="container">
        <a
          class="navbar-brand text-white animate__animated animate__fadeIn d-flex align-items-center"
          href="#"
        >
          <i class="fas fa-ribbon me-2"></i>
          <span class="fw-bold">MedConnect</span>
        </a>
        <span
          class="text-white-50 d-none d-md-block animate__animated animate__fadeIn animate__delay-1s"
          >Supporting cancer patients and their care network</span
        >
      </div>
    </nav>

    <div class="container main-container">
      <div class="row w-100">
        <!-- Left side with images (will stack on mobile) -->
        <div class="col-lg-6 image-side animate__animated animate__fadeInLeft">
          <img
            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
            alt="Supportive Care"
            class="img-fluid mb-4 shadow"
          />

          <div
            class="testimonial animate__animated animate__fadeIn animate__delay-1s"
          >
            <div class="testimonial-content">
              <div class="d-flex mb-3 align-items-center">
                <img
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="Patient"
                  class="testimonial-avatar me-3"
                />
                <div>
                  <h5 class="mb-1 fw-bold">Sarah Johnson</h5>
                  <p class="text-muted mb-0 fst-italic">
                    Breast Cancer Survivor
                  </p>
                </div>
              </div>
              <p class="mb-0 lead">
                <i class="fas fa-quote-left me-2 opacity-50"></i>MedConnect made
                my cancer journey less lonely. Having all my caregivers
                connected made a world of difference.<i
                  class="fas fa-quote-right ms-2 opacity-50"
                ></i>
              </p>
            </div>
          </div>
        </div>

        <!-- Right side with form -->
        <div class="col-lg-6 animate__animated animate__fadeInRight">
          <div class="form-container p-5">
            <div class="form-header text-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
                alt="Cancer Support Logo"
                class="rounded-circle"
              />
              <h2 class="mb-1 fw-bold">Welcome Back!</h2>
              <p class="text-white-50 mb-0 fw-light">
                Sign in to your MedConnect account
              </p>
            </div>

            <form id="loginForm" action="/login" method="POST" class="mt-4">
              <div class="mb-3">
                <label class="form-label">Username</label>
                <div class="input-group">
                  <span class="input-group-text"
                    ><i class="fas fa-user"></i
                  ></span>
                  <input
                    type="text"
                    name="username"
                    class="form-control"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Password</label>
                <div class="input-group">
                  <span class="input-group-text"
                    ><i class="fas fa-lock"></i
                  ></span>
                  <input
                    type="password"
                    name="password"
                    class="form-control"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label">User Type</label>
                <div class="input-group">
                  <span class="input-group-text"
                    ><i class="fas fa-user-tag"></i
                  ></span>
                  <select name="userType" class="form-select" required>
                    <option value="">Select Your Role</option>
                    <option value="Patient">Patient</option>
                    <option value="Patient-Navigator">Patient Navigator</option>
                    <option value="Caregiver">Caregiver</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                class="btn btn-medical w-100 animate__animated animate__pulse animate__infinite animate__slower"
              >
                <i class="fas fa-sign-in-alt me-2"></i>Sign In
              </button>

              <div
                class="d-flex justify-content-between align-items-center mt-4"
              >
                <a href="#" class="text-muted small"
                  ><i class="fas fa-question-circle me-1"></i> Forgot
                  Password?</a
                >
                <a href="#" class="text-muted small"
                  ><i class="fas fa-life-ring me-1"></i> Need Help?</a
                >
              </div>

              <hr class="my-4" />

              <p class="text-center mb-0">
                Don't have an account?
                <a href="/signup" class="create-account-link fw-bold">
                  Create Account <i class="fas fa-arrow-right ms-1 small"></i>
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div
      class="support-ribbon animate__animated animate__fadeInUp animate__delay-1s"
    >
      <i class="fas fa-ribbon me-2"></i> Supporting Cancer Patients
    </div>

    <div class="decorative-wave"></div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
      $(document).ready(function () {
        // Add some animations when the page loads
        setTimeout(function () {
          $(".form-container").addClass("animate__pulse");
          setTimeout(function () {
            $(".form-container").removeClass("animate__pulse");
          }, 1000);
        }, 1500);

        $("#loginForm").submit(function (e) {
          e.preventDefault();

          // Show loading state
          Swal.fire({
            title: "Signing in...",
            text: "Please wait",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          const formData = {
            username: $('input[name="username"]').val().trim(),
            password: $('input[name="password"]').val(),
            userType: $('select[name="userType"]').val(),
          };

          // Basic validation
          if (!formData.username || !formData.password) {
            Swal.close();
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Please enter both username and password",
            });
            return;
          }

          if (!formData.userType) {
            Swal.close();
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Please select a user type",
            });
            return;
          }

          // Submit login request
          $.ajax({
            type: "POST",
            url: "/login",
            data: formData,
            success: function (response) {
              Swal.close();

              if (response.success) {
                Swal.fire({
                  icon: "success",
                  title: "Login Successful",
                  text: "Redirecting to your dashboard...",
                  timer: 1500,
                  showConfirmButton: false,
                }).then(() => {
                  window.location.href = response.redirect;
                });
              } else {
                // Handle success response with error message
                Swal.fire({
                  icon: "error",
                  title: "Login Failed",
                  text: response.message || "An error occurred during login",
                });
              }
            },
            error: function (xhr) {
              Swal.close();
              const response = xhr.responseJSON || {};
              Swal.fire({
                icon: "error",
                title: "Login Failed",
                text:
                  response.message ||
                  "Invalid username, password, or user type",
              });
            },
          });
        });
      });
    </script>
  </body>
</html>

```

### views\pages\auth\signup.ejs
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MedConnect - Sign Up</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      rel="stylesheet"
    />
    <link
      href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --primary-blue: #2a5c82;
        --secondary-blue: #5c9baf;
        --accent-teal: #4ecdc4;
        --accent-purple: #b66dff;
        --warm-pink: #ff7e92;
        --soft-peach: #fff0f3;
        --light-teal: #e0f7fa;
        --dark-blue: #1a3c62;
      }

      body {
        background-image: url("https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80");
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        min-height: 100vh;
        font-family: "Poppins", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        position: relative;
        color: #333;
      }

      body::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          135deg,
          rgba(42, 92, 130, 0.9) 0%,
          rgba(92, 155, 175, 0.8) 100%
        );
        z-index: -1;
      }

      .medical-header {
        background: rgba(42, 92, 130, 0.95);
        padding: 1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .main-container {
        padding: 2rem 0;
        position: relative;
        z-index: 1;
      }

      /* Floating particles */
      .particles {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: -1;
        overflow: hidden;
      }

      .particle {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        animation: float 15s infinite ease-in-out;
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(0) translateX(0);
        }
        25% {
          transform: translateY(-30px) translateX(15px);
        }
        50% {
          transform: translateY(-15px) translateX(-15px);
        }
        75% {
          transform: translateY(30px) translateX(-30px);
        }
      }

      .card {
        border: none;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        background: rgba(255, 255, 255, 0.97);
        backdrop-filter: blur(10px);
        transition: all 0.4s ease;
        transform: perspective(1000px) rotateY(5deg);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .card:hover {
        transform: perspective(1000px) rotateY(0deg) translateY(-10px);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
      }

      .card-header {
        background: linear-gradient(
          135deg,
          var(--primary-blue),
          var(--secondary-blue)
        );
        color: white;
        padding: 1.5rem;
        border-bottom: none;
        position: relative;
        text-align: center;
      }

      .card-header::after {
        content: "";
        position: absolute;
        bottom: -10px;
        left: calc(50% - 10px);
        width: 20px;
        height: 20px;
        background: var(--secondary-blue);
        transform: rotate(45deg);
      }

      .card-header img {
        display: block;
        margin: 0 auto 15px auto;
        width: 80px;
        filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2));
        animation: float 5s infinite ease-in-out;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.5);
        background: white;
        padding: 5px;
      }

      .input-group {
        border-radius: 50px;
        overflow: hidden;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
        margin-bottom: 20px;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      .input-group:focus-within {
        box-shadow: 0 5px 15px rgba(76, 205, 196, 0.2);
        transform: translateY(-2px);
      }

      .input-group-text {
        background-color: #f8f9fa;
        border: none;
        width: 50px;
        display: flex;
        justify-content: center;
        border-right: 1px solid rgba(0, 0, 0, 0.1);
        color: var(--primary-blue);
      }

      .form-control,
      .form-select {
        border: none;
        padding: 12px 15px;
        font-size: 0.95rem;
        background-color: #fff;
      }

      input:focus,
      select:focus,
      textarea:focus {
        border-color: var(--accent-teal) !important;
        box-shadow: none !important;
        outline: none !important;
      }

      .form-label {
        font-weight: 500;
        color: var(--dark-blue);
        margin-bottom: 8px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
      }

      .form-label i {
        margin-right: 5px;
        color: var(--accent-teal);
      }

      .btn-primary {
        background: var(--accent-teal);
        color: white;
        padding: 12px 30px;
        transition: all 0.4s ease;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        letter-spacing: 0.5px;
        position: relative;
        overflow: hidden;
        z-index: 1;
        box-shadow: 0 5px 15px rgba(76, 205, 196, 0.3);
      }

      .btn-primary::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent
        );
        transition: all 0.4s ease;
        z-index: -1;
      }

      .btn-primary:hover::before {
        left: 100%;
      }

      .btn-primary:hover {
        background: var(--secondary-blue);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(76, 205, 196, 0.4);
      }

      .btn-primary:active {
        transform: translateY(1px);
      }

      .terms-link {
        color: var(--accent-teal);
        font-weight: 600;
        transition: all 0.3s ease;
        text-decoration: none;
        position: relative;
        padding-bottom: 2px;
      }

      .terms-link::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: var(--accent-teal);
        transition: width 0.3s ease;
      }

      .terms-link:hover::after {
        width: 100%;
      }

      .terms-link:hover {
        color: var(--primary-blue);
      }

      /* Support ribbon */
      .support-ribbon {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: linear-gradient(135deg, var(--warm-pink), #ff5c7f);
        color: white;
        padding: 12px 20px;
        border-radius: 50px;
        box-shadow: 0 10px 20px rgba(255, 126, 146, 0.4);
        z-index: 100;
        animation: pulse 2s infinite;
        font-weight: 600;
        font-size: 0.9rem;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 5px 15px rgba(255, 126, 146, 0.4);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 10px 25px rgba(255, 126, 146, 0.6);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 5px 15px rgba(255, 126, 146, 0.4);
        }
      }

      /* Floating cancer awareness icons */
      .floating-icon {
        position: absolute;
        opacity: 0.15;
        z-index: -1;
        filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.1));
      }

      .icon-1 {
        top: 20%;
        left: 10%;
        animation: floating 8s infinite ease-in-out;
      }

      .icon-2 {
        top: 40%;
        right: 10%;
        animation: floating 12s infinite ease-in-out;
      }

      .icon-3 {
        bottom: 25%;
        left: 20%;
        animation: floating 10s infinite ease-in-out;
      }

      @keyframes floating {
        0% {
          transform: translateY(0px) rotate(0deg) scale(1);
          opacity: 0.1;
        }
        50% {
          transform: translateY(-20px) rotate(10deg) scale(1.1);
          opacity: 0.2;
        }
        100% {
          transform: translateY(0px) rotate(0deg) scale(1);
          opacity: 0.1;
        }
      }

      .form-check-label {
        font-size: 0.9rem;
      }

      .form-check-input {
        cursor: pointer;
      }

      .form-check-input:checked {
        background-color: var(--accent-teal);
        border-color: var(--accent-teal);
      }

      .decorative-wave {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 150px;
        background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg"><path fill="%232A5C82" fill-opacity="0.1" d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,101.3C672,85,768,107,864,138.7C960,171,1056,213,1152,208C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
        z-index: -1;
      }

      /* Video container */
      .video-container {
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
        position: relative;
        height: 100%;
        min-height: 300px;
        transform: perspective(1000px) rotateY(-5deg);
        transition: all 0.5s ease;
        border: 8px solid white;
      }

      .video-container:hover {
        transform: perspective(1000px) rotateY(0deg) translateY(-10px);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
      }

      .video-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        padding: 25px;
        background: linear-gradient(
          to top,
          rgba(42, 92, 130, 0.9),
          transparent
        );
        color: white;
      }

      /* Testimonial */
      .testimonial-card {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: 25px;
        margin-top: 20px;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        overflow: hidden;
      }

      .testimonial-card::before {
        content: "\f10d";
        font-family: "Font Awesome 5 Free";
        font-weight: 900;
        position: absolute;
        top: -15px;
        left: -10px;
        font-size: 6rem;
        color: rgba(76, 205, 196, 0.1);
        z-index: 0;
      }

      .testimonial-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid var(--accent-teal);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }

      .features-list {
        padding-left: 1.5rem;
        margin-bottom: 0;
        position: relative;
        z-index: 1;
      }

      .features-list li {
        margin-bottom: 0.5rem;
        position: relative;
      }

      .features-list li::before {
        content: "\f00c";
        font-family: "Font Awesome 5 Free";
        font-weight: 900;
        color: var(--accent-teal);
        position: absolute;
        left: -1.5rem;
      }

      @media (max-width: 991.98px) {
        .card {
          margin-bottom: 2rem;
        }
      }
    </style>
  </head>
  <body>
    <!-- Dynamic particles -->
    <div class="particles">
      <div
        class="particle"
        style="
          width: 15px;
          height: 15px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 20px;
          height: 20px;
          top: 30%;
          left: 25%;
          animation-delay: 1s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 10px;
          height: 10px;
          top: 50%;
          left: 15%;
          animation-delay: 2s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 25px;
          height: 25px;
          top: 65%;
          left: 70%;
          animation-delay: 3s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 12px;
          height: 12px;
          top: 80%;
          left: 50%;
          animation-delay: 4s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 18px;
          height: 18px;
          top: 15%;
          left: 60%;
          animation-delay: 5s;
        "
      ></div>
      <div
        class="particle"
        style="
          width: 15px;
          height: 15px;
          top: 40%;
          left: 80%;
          animation-delay: 6s;
        "
      ></div>
    </div>

    <!-- Floating cancer awareness icons -->
    <div class="floating-icon icon-1">
      <i class="fas fa-ribbon fa-4x" style="color: var(--warm-pink)"></i>
    </div>
    <div class="floating-icon icon-2">
      <i class="fas fa-heart fa-4x" style="color: var(--accent-purple)"></i>
    </div>
    <div class="floating-icon icon-3">
      <i
        class="fas fa-hand-holding-heart fa-4x"
        style="color: var(--accent-teal)"
      ></i>
    </div>

    <!-- Header -->
    <nav class="navbar medical-header">
      <div class="container">
        <a
          class="navbar-brand text-white animate__animated animate__fadeIn d-flex align-items-center"
          href="#"
        >
          <i class="fas fa-ribbon me-2"></i>
          <span class="fw-bold">MedConnect</span>
        </a>
        <span
          class="ms-3 text-white-50 d-none d-md-block animate__animated animate__fadeIn animate__delay-1s"
          >Supporting cancer patients and their care network</span
        >
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container main-container">
      <div class="row g-4">
        <!-- Left Column - Form -->
        <div class="col-lg-8 animate__animated animate__fadeInLeft">
          <div class="card">
            <div class="card-header">
              <img
                src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
                alt="Cancer Support Logo"
                class="rounded-circle"
              />
              <h2 class="mb-1 fw-bold">Create Your Account</h2>
              <p class="text-white-50 mb-0 fw-light">
                Join our supportive cancer care community
              </p>
            </div>
            <div class="card-body p-5">
              <form id="signupForm" action="/signup" method="POST">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="fullName" class="form-label">
                      <i class="fas fa-user"></i> Full Name
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="fas fa-user"></i
                      ></span>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        class="form-control"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="email" class="form-label">
                      <i class="fas fa-envelope"></i> Email Address
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="fas fa-envelope"></i
                      ></span>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        class="form-control"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div class="col-md-4">
                    <label for="age" class="form-label">
                      <i class="fas fa-birthday-cake"></i> Age
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="fas fa-birthday-cake"></i
                      ></span>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        class="form-control"
                        placeholder="Your age"
                        required
                      />
                    </div>
                  </div>

                  <div class="col-md-4">
                    <label for="phone" class="form-label">
                      <i class="fas fa-phone"></i> Phone Number
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="fas fa-phone"></i
                      ></span>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        class="form-control"
                        placeholder="Your phone number"
                        required
                      />
                    </div>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label d-block">
                      <i class="fas fa-venus-mars"></i> Gender
                    </label>
                    <div class="d-flex gap-4 mt-2">
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="radio"
                          name="sex"
                          value="Male"
                          id="male"
                          required
                        />
                        <label class="form-check-label" for="male">Male</label>
                      </div>
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="radio"
                          name="sex"
                          value="Female"
                          id="female"
                        />
                        <label class="form-check-label" for="female"
                          >Female</label
                        >
                      </div>
                    </div>
                  </div>

                  <div class="col-12">
                    <label for="address" class="form-label">
                      <i class="fas fa-map-marker-alt"></i> Address
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="fas fa-home"></i
                      ></span>
                      <textarea
                        id="address"
                        name="address"
                        class="form-control"
                        rows="2"
                        placeholder="Your residential address"
                        required
                      ></textarea>
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="username" class="form-label">
                      <i class="fas fa-id-badge"></i> Username
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="fas fa-user-circle"></i
                      ></span>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        class="form-control"
                        placeholder="Choose a username"
                        required
                      />
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="password" class="form-label">
                      <i class="fas fa-key"></i> Password
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="fas fa-lock"></i
                      ></span>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        class="form-control"
                        placeholder="Create a strong password"
                        required
                      />
                    </div>
                    <div class="password-strength mt-1 small"></div>
                  </div>

                  <div class="col-12">
                    <label for="userType" class="form-label">
                      <i class="fas fa-users"></i> I am a
                    </label>
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="fas fa-users"></i
                      ></span>
                      <select
                        class="form-select"
                        id="userType"
                        name="userType"
                        required
                      >
                        <option value="">Select Your Role</option>
                        <option value="Patient">Patient</option>
                        <option value="Patient-Navigator">
                          Patient Navigator
                        </option>
                        <option value="Caregiver">Caregiver</option>
                      </select>
                    </div>
                  </div>

                  <div class="col-12 mt-2">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        name="termsAgreement"
                        id="termsAgreement"
                        required
                      />
                      <label class="form-check-label" for="termsAgreement">
                        I agree to the
                        <a href="#" class="terms-link">Terms of Service</a> and
                        <a href="#" class="terms-link">Privacy Policy</a>
                      </label>
                    </div>
                  </div>

                  <div class="col-12 mt-4">
                    <button
                      type="submit"
                      class="btn btn-primary w-100 animate__animated animate__pulse animate__infinite animate__slower"
                      id="createAccountBtn"
                    >
                      <i class="fas fa-user-plus me-2"></i> Create My Account
                    </button>

                    <div
                      class="d-flex justify-content-between align-items-center mt-4"
                    >
                      <a href="#" class="text-muted small"
                        ><i class="fas fa-question-circle me-1"></i> Need
                        Help?</a
                      >
                      <a href="#" class="text-muted small"
                        ><i class="fas fa-shield-alt me-1"></i> Privacy
                        Policy</a
                      >
                    </div>

                    <hr class="my-4" />

                    <p class="text-center mb-0">
                      Already have an account?
                      <a href="/login" class="terms-link fw-bold">
                        Sign In <i class="fas fa-arrow-right ms-1 small"></i>
                      </a>
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="col-lg-4 animate__animated animate__fadeInRight">
          <div class="video-container">
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              alt="Supportive Care"
              class="img-fluid h-100"
              style="object-fit: cover"
            />
            <div
              class="video-overlay animate__animated animate__fadeIn animate__delay-1s"
            >
              <h4 class="mb-1 fw-bold">Supporting Your Journey</h4>
              <p class="mb-0">
                Connect with care providers and fellow patients
              </p>
            </div>
          </div>

          <!-- <div
            class="testimonial-card animate__animated animate__fadeIn animate__delay-1s"
          >
            <div class="d-flex mb-3 align-items-center">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="Patient"
                class="testimonial-avatar me-3"
              />
              <div>
                <h5 class="mb-1 fw-bold">Robert Johnson</h5>
                <p class="text-muted mb-0 fst-italic">Lung Cancer Survivor</p>
              </div>
            </div>
            <p class="lead mb-3">
              <i class="fas fa-quote-left me-2 opacity-50"></i> MedConnect
              helped me coordinate care between my oncologist and primary care
              doctor. The support made all the difference.
              <i class="fas fa-quote-right ms-2 opacity-50"></i>
            </p>

            <div class="mt-4">
              <h6 class="fw-bold mb-2">Benefits of joining:</h6>
              <ul class="features-list">
                <li>Connect with specialized patient navigators</li>
                <li>Coordinate care between multiple providers</li>
                <li>Access educational resources and support</li>
                <li>Keep all your medical records in one place</li>
              </ul>
            </div>
          </div> -->
        </div>
      </div>
    </main>

    <!-- Support Badge -->
    <div
      class="support-ribbon animate__animated animate__fadeInUp animate__delay-1s"
    >
      <i class="fas fa-ribbon me-2"></i> Supporting Cancer Patients
    </div>

    <!-- Decorative wave -->
    <div class="decorative-wave"></div>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
      $(document).ready(function () {
        // Add some animations when the page loads
        setTimeout(function () {
          $(".card").addClass("animate__pulse");
          setTimeout(function () {
            $(".card").removeClass("animate__pulse");
          }, 1000);
        }, 1500);

        // Password strength indicator
        $("#password").on("input", function () {
          let password = $(this).val();
          let strength = 0;
          let message = "";

          if (password.length >= 8) strength += 1;
          if (password.match(/[A-Z]/)) strength += 1;
          if (password.match(/[0-9]/)) strength += 1;
          if (password.match(/[^a-zA-Z0-9]/)) strength += 1;

          switch (strength) {
            case 0:
              message = "";
              break;
            case 1:
              message = "<span class='text-danger'>Weak password</span>";
              break;
            case 2:
              message = "<span class='text-warning'>Medium strength</span>";
              break;
            case 3:
              message = "<span class='text-info'>Strong password</span>";
              break;
            case 4:
              message =
                "<span class='text-success'>Very strong password</span>";
              break;
          }

          $(".password-strength").html(message);
        });

        // Form submission
        $("#signupForm").submit(function (e) {
          e.preventDefault();

          // Show loading state
          Swal.fire({
            title: "Processing...",
            text: "Creating your account",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          // Get form data
          const formData = {
            username: $("#username").val(),
            password: $("#password").val(),
            fullName: $("#fullName").val(),
            email: $("#email").val(),
            age: $("#age").val(),
            phone: $("#phone").val(),
            sex: $('input[name="sex"]:checked').val(),
            address: $("#address").val(),
            userType: $("#userType").val(),
          };

          // Simple validation
          if (
            !formData.username ||
            !formData.password ||
            !formData.fullName ||
            !formData.email ||
            !formData.userType
          ) {
            Swal.close();
            Swal.fire({
              icon: "error",
              title: "Form Error",
              text: "Please fill in all required fields correctly.",
            });
            return;
          }

          if (!formData.sex) {
            Swal.close();
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Please select your gender",
            });
            return;
          }

          if (!$("#termsAgreement").is(":checked")) {
            Swal.close();
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "You must agree to the Terms of Service and Privacy Policy",
            });
            return;
          }

          // Send the data to the server
          $.ajax({
            type: "POST",
            url: "/signup",
            data: formData,
            success: function (response) {
              Swal.close();
              if (response.success) {
                Swal.fire({
                  icon: "success",
                  title: "Success!",
                  text:
                    response.message ||
                    "Your account has been created successfully!",
                  timer: 1500,
                  showConfirmButton: false,
                }).then(() => {
                  window.location.href = response.redirect;
                });
              } else {
                // Handle server success but with error message
                Swal.fire({
                  icon: "error",
                  title: "Registration Failed",
                  text:
                    response.message || "An error occurred during registration",
                });
              }
            },
            error: function (xhr) {
              Swal.close();
              const response = xhr.responseJSON || {};
              Swal.fire({
                icon: "error",
                title: "Registration Failed",
                text:
                  response.message ||
                  "An error occurred during registration. Please try again.",
              });
              console.error("Registration error:", xhr);
            },
          });
        });
      });
    </script>
  </body>
</html>

```

### views\pages\caregiver\appointment-management.ejs
```

```

### views\pages\caregiver\dashboard.ejs
```

```

### views\pages\caregiver\feedback-management.ejs
```

```

### views\pages\caregiver\patient-info.ejs
```

```

### views\pages\caregiver\progress-reports.ejs
```

```

### views\pages\navigator\appointment-management.ejs
```

```

### views\pages\navigator\care-plan.ejs
```

```

### views\pages\navigator\dashboard.ejs
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Patient Navigator Dashboard - MedConnect</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      rel="stylesheet"
    />
    <style>
      :root {
        --primary-blue: #2a5c82;
        --secondary-blue: #5c9baf;
        --accent-teal: #4ecdc4;
        --light-gray: #f8f9fa;
        --border-color: #dee2e6;
      }

      body {
        background-color: var(--light-gray);
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      }

      .dashboard-header {
        background: var(--primary-blue);
        color: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        position: sticky;
        top: 0;
        z-index: 1000;
      }

      .sidebar {
        background: white;
        min-height: calc(100vh - 60px);
        border-right: 1px solid var(--border-color);
        padding-top: 20px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
      }

      .main-content {
        padding: 25px;
        background-color: var(--light-gray);
      }

      .nav-link {
        color: #333;
        padding: 0.8rem 1rem;
        border-radius: 0.5rem;
        margin: 0.3rem 0;
        transition: all 0.3s ease;
      }

      .nav-link.active {
        background-color: var(--accent-teal);
        color: white;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }

      .nav-link:hover:not(.active) {
        background: rgba(76, 205, 196, 0.1);
        color: var(--accent-teal);
      }

      .welcome-card {
        background: linear-gradient(
          135deg,
          var(--primary-blue) 0%,
          var(--secondary-blue) 100%
        );
        color: white;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        border-radius: 15px;
        border: none;
      }

      .card {
        border-radius: 15px;
        border: none;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        overflow: hidden;
      }

      .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }

      .card-title {
        font-weight: 600;
        color: var(--primary-blue);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 12px;
        margin-bottom: 20px;
      }

      /* Stat card styles */
      .stat-card {
        background: white;
        border-radius: 15px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        padding: 20px;
        height: 100%;
        display: flex;
        align-items: center;
        transition: transform 0.3s ease;
      }

      .stat-card:hover {
        transform: translateY(-5px);
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        font-size: 24px;
        color: white;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }

      .stat-patients-icon {
        background: var(--primary-blue);
      }

      .stat-appointments-icon {
        background: var(--accent-teal);
      }

      .stat-messages-icon {
        background: #ffc107;
      }

      .stat-tasks-icon {
        background: #6f42c1;
      }

      .stat-number {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 5px;
        color: #333;
      }

      .stat-label {
        color: #6c757d;
        font-size: 14px;
      }

      /* Patient card styles */
      .patient-card .card {
        transition: transform 0.2s;
        height: 100%;
        border-radius: 12px;
      }

      .patient-info {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
      }

      .patient-avatar {
        width: 40px;
        height: 40px;
        background: var(--primary-blue);
        color: white;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 12px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }

      .patient-name {
        margin-bottom: 0;
        font-weight: 600;
      }

      .patient-details {
        font-size: 12px;
        color: #6c757d;
      }

      .status-badge {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 30px;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 10px;
      }

      .status-high-risk {
        background: rgba(220, 53, 69, 0.1);
        color: #dc3545;
      }

      .status-medium-risk {
        background: rgba(255, 193, 7, 0.1);
        color: #ffc107;
      }

      .patient-action-buttons {
        display: flex;
        gap: 10px;
      }

      .patient-action-buttons .btn {
        border-radius: 30px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
      }

      .patient-action-buttons .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      /* Task list styles */
      .task-list {
        list-style: none;
        padding: 0;
      }

      .task-item {
        display: flex;
        align-items: flex-start;
        padding: 15px 0;
        border-bottom: 1px solid var(--border-color);
        transition: transform 0.2s;
      }

      .task-item:hover {
        transform: translateX(5px);
      }

      .task-item:last-child {
        border-bottom: none;
      }

      .task-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: rgba(42, 92, 130, 0.1);
        color: var(--primary-blue);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        font-size: 16px;
      }

      .task-content {
        flex: 1;
      }

      .task-title {
        font-weight: 500;
        margin-bottom: 5px;
        color: #333;
      }

      .task-meta {
        display: flex;
        font-size: 12px;
        color: #6c757d;
        justify-content: space-between;
      }

      .overdue {
        color: #dc3545;
        font-weight: 500;
      }

      .btn-primary {
        background-color: var(--accent-teal);
        border-color: var(--accent-teal);
        border-radius: 30px;
        padding: 8px 20px;
        font-weight: 500;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }

      .btn-primary:hover {
        background-color: var(--primary-blue);
        border-color: var(--primary-blue);
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
      }

      .btn-outline-primary {
        color: var(--accent-teal);
        border-color: var(--accent-teal);
        border-radius: 30px;
        transition: all 0.3s ease;
      }

      .btn-outline-primary:hover {
        background-color: var(--accent-teal);
        color: white;
        border-color: var(--accent-teal);
      }

      .table {
        border-radius: 10px;
        overflow: hidden;
      }

      .table thead th {
        background-color: rgba(42, 92, 130, 0.05);
        color: var(--primary-blue);
        font-weight: 600;
        border-bottom: none;
      }

      .table-hover tbody tr:hover {
        background-color: rgba(76, 205, 196, 0.05);
      }

      .badge {
        font-weight: 500;
        padding: 5px 10px;
        border-radius: 30px;
      }

      .form-control {
        border-radius: 30px;
        padding: 10px 15px;
        border: 1px solid var(--border-color);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      }

      .form-control:focus {
        border-color: var(--accent-teal);
        box-shadow: 0 0 0 0.25rem rgba(76, 205, 196, 0.25);
      }

      @media (max-width: 767.98px) {
        .sidebar {
          min-height: auto;
        }
        .main-content {
          padding: 15px;
        }
      }
    </style>
  </head>
  <body>
    <div class="dashboard-header py-2">
      <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h1 class="h4 mb-0">
              <i class="fas fa-hospital me-2"></i>MedConnect
            </h1>
          </div>
          <div class="d-flex align-items-center">
            <div class="dropdown">
              <button
                class="btn btn-link text-white dropdown-toggle"
                type="button"
                id="userDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="fas fa-user-circle me-1"></i>
                <%= user.fullName %>
              </button>
              <ul
                class="dropdown-menu dropdown-menu-end shadow-sm"
                aria-labelledby="userDropdown"
              >
                <li>
                  <a class="dropdown-item" href="/profile">
                    <i class="fas fa-user me-2"></i>Profile
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="/settings">
                    <i class="fas fa-cog me-2"></i>Settings
                  </a>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a class="dropdown-item" href="/logout">
                    <i class="fas fa-sign-out-alt me-2"></i>Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid">
      <div class="row">
        <!-- Sidebar -->
        <div class="col-lg-2 col-md-3 sidebar">
          <ul class="nav flex-column">
            <li class="nav-item">
              <a class="nav-link active" href="/navigator/dashboard">
                <i class="fas fa-tachometer-alt me-2"></i>Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/navigator/patient-management">
                <i class="fas fa-users me-2"></i>Patients
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/navigator/appointments">
                <i class="fas fa-calendar-alt me-2"></i>Appointments
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/navigator/tasks">
                <i class="fas fa-tasks me-2"></i>Tasks
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/navigator/messages">
                <i class="fas fa-envelope me-2"></i>Messages
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/navigator/reports">
                <i class="fas fa-chart-bar me-2"></i>Reports
              </a>
            </li>
          </ul>
        </div>

        <!-- Main Content -->
        <div class="col-lg-10 col-md-9 main-content">
          <div class="welcome-card p-4 rounded mb-4">
            <h2>Welcome, <%= user.fullName %></h2>
            <p class="mb-0">
              Monitor patient progress, manage appointments, and coordinate care
              services.
            </p>
          </div>

          <!-- Statistics Section -->
          <div class="row mb-4">
            <div class="col-md-6 col-lg-3 mb-4">
              <div class="stat-card">
                <div class="stat-icon stat-patients-icon">
                  <i class="fas fa-users"></i>
                </div>
                <div class="stat-content">
                  <h2 class="stat-number" data-target="12">0</h2>
                  <div class="stat-label">Active Patients</div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-lg-3 mb-4">
              <div class="stat-card">
                <div class="stat-icon stat-appointments-icon">
                  <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-content">
                  <h2 class="stat-number" data-target="5">0</h2>
                  <div class="stat-label">Today's Appointments</div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-lg-3 mb-4">
              <div class="stat-card">
                <div class="stat-icon stat-messages-icon">
                  <i class="fas fa-comments"></i>
                </div>
                <div class="stat-content">
                  <h2 class="stat-number" data-target="8">0</h2>
                  <div class="stat-label">Unread Messages</div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-lg-3 mb-4">
              <div class="stat-card">
                <div class="stat-icon stat-tasks-icon">
                  <i class="fas fa-tasks"></i>
                </div>
                <div class="stat-content">
                  <h2 class="stat-number" data-target="10">0</h2>
                  <div class="stat-label">Pending Tasks</div>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <!-- Patient Overview Section -->
            <div class="col-lg-7 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h5 class="card-title">
                    <i class="fas fa-users me-2"></i>
                    My Patients
                  </h5>

                  <div class="mb-3">
                    <input
                      type="text"
                      class="form-control"
                      id="patientSearch"
                      placeholder="Search patients..."
                      onkeyup="filterPatients()"
                    />
                  </div>

                  <div class="row">
                    <!-- High Risk Patient -->
                    <div class="col-md-6 mb-3 patient-card">
                      <div class="card">
                        <div class="card-body">
                          <div class="patient-info">
                            <div class="patient-avatar">JD</div>
                            <div>
                              <h6 class="patient-name">John Doe</h6>
                              <div class="patient-details">42 years • Male</div>
                            </div>
                          </div>

                          <div class="status-badge status-high-risk">
                            <i class="fas fa-exclamation-triangle me-2"></i>High
                            Risk
                          </div>

                          <div class="small text-muted mb-2">
                            <i class="fas fa-stethoscope me-1"></i> Last
                            Screened: 3 days ago
                          </div>

                          <div class="patient-action-buttons">
                            <button class="btn btn-sm btn-outline-primary">
                              <i class="fas fa-user-md me-1"></i> Profile
                            </button>
                            <button class="btn btn-sm btn-outline-primary">
                              <i class="fas fa-phone-alt me-1"></i> Contact
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Medium Risk Patient -->
                    <div class="col-md-6 mb-3 patient-card">
                      <div class="card">
                        <div class="card-body">
                          <div class="patient-info">
                            <div class="patient-avatar">JS</div>
                            <div>
                              <h6 class="patient-name">Jane Smith</h6>
                              <div class="patient-details">
                                35 years • Female
                              </div>
                            </div>
                          </div>

                          <div class="status-badge status-medium-risk">
                            <i class="fas fa-exclamation-circle me-2"></i>Medium
                            Risk
                          </div>

                          <div class="small text-muted mb-2">
                            <i class="fas fa-stethoscope me-1"></i> Last
                            Screened: 5 days ago
                          </div>

                          <div class="patient-action-buttons">
                            <button class="btn btn-sm btn-outline-primary">
                              <i class="fas fa-user-md me-1"></i> Profile
                            </button>
                            <button class="btn btn-sm btn-outline-primary">
                              <i class="fas fa-phone-alt me-1"></i> Contact
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="text-center mt-3">
                    <a
                      href="/navigator/patient-management"
                      class="btn btn-primary"
                    >
                      <i class="fas fa-users me-2"></i>View All Patients
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tasks & Reminders Section -->
            <div class="col-lg-5 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h5 class="card-title">
                    <i class="fas fa-clipboard-check me-2"></i>
                    Upcoming Tasks
                  </h5>

                  <ul class="task-list">
                    <li class="task-item">
                      <div class="task-icon">
                        <i class="fas fa-phone-alt"></i>
                      </div>
                      <div class="task-content">
                        <div class="task-title">
                          Follow-up call with John Doe
                        </div>
                        <div class="task-meta">
                          <div class="task-patient">
                            <i class="fas fa-user me-1"></i>John Doe
                          </div>
                          <div class="task-due overdue">
                            <i class="fas fa-clock me-1"></i>Today, 2:00 PM
                          </div>
                        </div>
                      </div>
                    </li>

                    <li class="task-item">
                      <div class="task-icon">
                        <i class="fas fa-file-medical"></i>
                      </div>
                      <div class="task-content">
                        <div class="task-title">Review medical records</div>
                        <div class="task-meta">
                          <div class="task-patient">
                            <i class="fas fa-user me-1"></i>Jane Smith
                          </div>
                          <div class="task-due">
                            <i class="fas fa-clock me-1"></i>Tomorrow, 10:00 AM
                          </div>
                        </div>
                      </div>
                    </li>

                    <li class="task-item">
                      <div class="task-icon">
                        <i class="fas fa-calendar-check"></i>
                      </div>
                      <div class="task-content">
                        <div class="task-title">
                          Schedule follow-up appointment
                        </div>
                        <div class="task-meta">
                          <div class="task-patient">
                            <i class="fas fa-user me-1"></i>Robert Johnson
                          </div>
                          <div class="task-due">
                            <i class="fas fa-clock me-1"></i>Jun 24, 9:00 AM
                          </div>
                        </div>
                      </div>
                    </li>

                    <li class="task-item">
                      <div class="task-icon">
                        <i class="fas fa-clipboard-list"></i>
                      </div>
                      <div class="task-content">
                        <div class="task-title">Update care plan</div>
                        <div class="task-meta">
                          <div class="task-patient">
                            <i class="fas fa-user me-1"></i>Maria Rodriguez
                          </div>
                          <div class="task-due">
                            <i class="fas fa-clock me-1"></i>Jun 25, 11:00 AM
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>

                  <div class="text-center mt-3">
                    <button class="btn btn-primary">View All Tasks</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <!-- Recent Activities -->
            <div class="col-12 mb-4">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">
                    <i class="fas fa-history me-2"></i>
                    Recent Activities
                  </h5>

                  <div class="table-responsive">
                    <table class="table table-hover">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Patient</th>
                          <th>Activity</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Today, 10:30 AM</td>
                          <td>John Doe</td>
                          <td>Baseline health screening completed</td>
                          <td>
                            <span class="badge bg-success">Completed</span>
                          </td>
                        </tr>
                        <tr>
                          <td>Today, 9:15 AM</td>
                          <td>Jane Smith</td>
                          <td>New medical record uploaded</td>
                          <td><span class="badge bg-info">New</span></td>
                        </tr>
                        <tr>
                          <td>Yesterday, 3:45 PM</td>
                          <td>Robert Johnson</td>
                          <td>Appointment scheduled</td>
                          <td>
                            <span class="badge bg-primary">Scheduled</span>
                          </td>
                        </tr>
                        <tr>
                          <td>Yesterday, 11:20 AM</td>
                          <td>Maria Rodriguez</td>
                          <td>Care plan updated</td>
                          <td>
                            <span class="badge bg-success">Completed</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div class="text-center mt-3">
                    <button class="btn btn-primary">View All Activities</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // Function to filter patients
      function filterPatients() {
        var input, filter, cards, card, name, i;
        input = document.getElementById("patientSearch");
        filter = input.value.toUpperCase();
        cards = document.getElementsByClassName("patient-card");

        for (i = 0; i < cards.length; i++) {
          name = cards[i].getElementsByClassName("patient-name")[0];
          if (name.innerHTML.toUpperCase().indexOf(filter) > -1) {
            cards[i].style.display = "";
          } else {
            cards[i].style.display = "none";
          }
        }
      }

      // Counter animation for stats
      document.addEventListener("DOMContentLoaded", function () {
        const statNumbers = document.querySelectorAll(".stat-number");

        statNumbers.forEach((number) => {
          const target = parseInt(number.getAttribute("data-target"));
          let count = 0;
          const duration = 2000; // ms
          const increment = target / (duration / 30);

          const updateCount = () => {
            if (count < target) {
              count += increment;
              number.textContent = Math.ceil(count);
              setTimeout(updateCount, 30);
            } else {
              number.textContent = target;
            }
          };

          updateCount();
        });
      });
    </script>
  </body>
</html>

```

### views\pages\navigator\learning.ejs
```


```

### views\pages\navigator\patient-management.ejs
```

```

### views\pages\navigator\progress-tracking.ejs
```

```

### views\pages\navigator\resources.ejs
```

```

### views\pages\patient\appointments.ejs
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Appointments - MedConnect</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      rel="stylesheet"
    />
    <style>
      :root {
        --primary-blue: #2a5c82;
        --secondary-blue: #5c9baf;
        --accent-teal: #4ecdc4;
      }

      .dashboard-header {
        background: var(--primary-blue);
        color: white;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1030;
        height: 60px;
      }

      .sidebar {
        background: #f8f9fa;
        position: fixed;
        left: 0;
        top: 60px;
        bottom: 0;
        width: 250px;
        border-right: 1px solid #dee2e6;
        overflow-y: auto;
        z-index: 1020;
        padding: 20px 0;
      }

      .main-content {
        margin-left: 250px;
        margin-top: 60px;
        padding: 30px;
        min-height: calc(100vh - 60px);
      }

      .nav-link {
        color: #333;
        padding: 0.8rem 1.5rem;
        margin: 0.2rem 1rem;
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .nav-link:hover {
        background: var(--accent-teal);
        color: white !important;
      }

      .nav-link.active {
        background: var(--primary-blue);
        color: white !important;
      }

      .card {
        border: none;
        border-radius: 15px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
        margin-bottom: 20px;
      }

      .card:hover {
        transform: translateY(-5px);
      }
    </style>
  </head>
  <body>
    <!-- Fixed Header -->
    <header class="dashboard-header py-2">
      <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <i class="fas fa-hospital me-3 fs-4"></i>
            <h4 class="mb-0">MedConnect</h4>
          </div>
          <div class="d-flex align-items-center">
            <span class="me-3">Welcome, <%= user.fullName %></span>
            <a href="/logout" class="btn btn-outline-light btn-sm">Logout</a>
          </div>
        </div>
      </div>
    </header>

    <!-- Fixed Sidebar -->
    <div class="sidebar">
      <nav class="nav flex-column">
        <a
          href="/patient/dashboard"
          class="nav-link <%= locals.path === '/patient/dashboard' ? 'active' : '' %>"
        >
          <i class="fas fa-home me-2"></i> Dashboard
        </a>
        <a
          href="/patient/appointments"
          class="nav-link <%= locals.path === '/patient/appointments' ? 'active' : '' %>"
        >
          <i class="fas fa-calendar me-2"></i> Appointments
        </a>
        <a
          href="/patient/medical-records"
          class="nav-link <%= locals.path === '/patient/medical-records' ? 'active' : '' %>"
        >
          <i class="fas fa-file-medical me-2"></i> Medical Records
        </a>
        <a
          href="/baseline-screening"
          class="nav-link <%= locals.path === '/patient/baseline-screening' ? 'active' : '' %>"
        >
          <i class="fas fa-clipboard-check me-2"></i> Health Screening
        </a>
        <a
          href="#"
          class="nav-link <%= locals.path === '/patient/messages' ? 'active' : '' %>"
        >
          <i class="fas fa-comments me-2"></i> Messages
        </a>
        <a
          href="#"
          class="nav-link <%= locals.path === '/patient/navigator' ? 'active' : '' %>"
        >
          <i class="fas fa-user-md me-2"></i> My Navigator
        </a>
      </nav>
    </div>

    <!-- Main Content -->
    <main class="main-content">
      <div class="container-fluid p-0">
        <div class="row mb-4">
          <div class="col-12">
            <h2 class="mb-3">My Appointments</h2>
            <p class="text-muted">
              Manage your upcoming and past appointments with healthcare
              providers
            </p>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-body p-4">
                <h5 class="card-title mb-4">Schedule New Appointment</h5>
                <div class="row">
                  <!-- Appointment Scheduling Form Placeholder -->
                  <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Appointment scheduling is coming soon.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Chatbot CSS and JavaScript -->
    <link href="/css/chatbot-styles.css" rel="stylesheet" />
    <script src="/js/chatbot.js"></script>
  </body>
</html>

```

### views\pages\patient\baseline-screening.ejs
```
<%- include('../../partials/header') %>

<div class="progress-bar-container mb-4">
  <div class="progress" style="height: 8px">
    <div
      class="progress-bar progress-bar-striped progress-bar-animated"
      role="progressbar"
      style="width: 0%"
    ></div>
  </div>
  <div class="d-flex justify-content-between mt-2">
    <small class="text-muted">Progress</small>
    <small class="text-primary fw-bold"
      ><span id="progressPercentage">0</span>% Complete</small
    >
  </div>
</div>

<div class="row justify-content-center">
  <div class="col-lg-8">
    <div class="card">
      <div class="card-body">
        <h4 class="card-title mb-4">Baseline Health Screening</h4>
        <p class="text-muted mb-4">
          This confidential assessment helps us understand your health
          background and risks. Your honest responses will help us provide
          better personalized care.
        </p>

        <form id="screeningForm">
          <!-- Drug and Medication History -->
          <div class="screening-section mb-5">
            <h5 class="section-title">
              <i class="fas fa-pills text-primary me-2"></i>
              Medication & Drug History
            </h5>

            <div class="mb-3">
              <label class="form-label">Current Medications</label>
              <div class="tag-input-container">
                <input
                  type="text"
                  id="medicationInput"
                  class="form-control"
                  placeholder="Type medication name and press Enter"
                />
                <div
                  id="currentMedicationTags"
                  class="tag-container mt-2"
                ></div>
                <input
                  type="hidden"
                  id="currentMedications"
                  name="currentMedications"
                />
              </div>
              <small class="text-muted"
                >Include prescription and over-the-counter medications</small
              >
            </div>

            <div class="mb-3">
              <label class="form-label">Medication Allergies</label>
              <div class="tag-input-container">
                <input
                  type="text"
                  id="allergyInput"
                  class="form-control"
                  placeholder="Type allergy and press Enter"
                />
                <div
                  id="medicationAllergyTags"
                  class="tag-container mt-2"
                ></div>
                <input
                  type="hidden"
                  id="medicationAllergies"
                  name="medicationAllergies"
                />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Recreational Drug Use</label>
              <select class="form-select" name="recreationalDrugUse">
                <option value="Never">Never</option>
                <option value="Former">Former</option>
                <option value="Current">Current</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <!-- Disease History -->
          <div class="screening-section mb-5">
            <h5 class="section-title">
              <i class="fas fa-heartbeat text-danger me-2"></i>
              Personal Health History
            </h5>

            <div class="mb-3">
              <label class="form-label">Chronic Conditions</label>
              <div class="tag-input-container">
                <input
                  type="text"
                  id="conditionInput"
                  class="form-control"
                  placeholder="Type condition and press Enter"
                />
                <div id="chronicConditionTags" class="tag-container mt-2"></div>
                <input
                  type="hidden"
                  id="chronicConditions"
                  name="chronicConditions"
                />
              </div>
              <small class="text-muted"
                >E.g., diabetes, hypertension, asthma</small
              >
            </div>

            <div class="mb-3">
              <label class="form-label"
                >Past Surgeries or Hospitalizations</label
              >
              <div class="tag-input-container">
                <input
                  type="text"
                  id="surgeryInput"
                  class="form-control"
                  placeholder="Type surgery/hospitalization and press Enter"
                />
                <div id="pastSurgeryTags" class="tag-container mt-2"></div>
                <input type="hidden" id="pastSurgeries" name="pastSurgeries" />
              </div>
              <small class="text-muted"
                >Include year if possible (e.g., Appendectomy 2018)</small
              >
            </div>

            <div class="mb-3">
              <label class="form-label">Mental Health Conditions</label>
              <div class="tag-input-container">
                <input
                  type="text"
                  id="mentalHealthInput"
                  class="form-control"
                  placeholder="Type condition and press Enter"
                />
                <div id="mentalHealthTags" class="tag-container mt-2"></div>
                <input
                  type="hidden"
                  id="mentalHealthConditions"
                  name="mentalHealthConditions"
                />
              </div>
              <small class="text-muted">E.g., depression, anxiety, PTSD</small>
            </div>
          </div>

          <!-- Family History -->
          <div class="screening-section mb-5">
            <h5 class="section-title">
              <i class="fas fa-users text-success me-2"></i>
              Family Health History
            </h5>
            <p class="text-muted mb-3">
              Select conditions that exist in your immediate family (parents,
              siblings, children)
            </p>

            <div class="row mb-3">
              <div class="col-md-6">
                <div class="form-check mb-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="familyCancer"
                    name="familyHistory.cancer"
                  />
                  <label class="form-check-label" for="familyCancer"
                    >Cancer</label
                  >
                </div>
                <div class="form-check mb-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="familyHeartDisease"
                    name="familyHistory.heartDisease"
                  />
                  <label class="form-check-label" for="familyHeartDisease"
                    >Heart Disease</label
                  >
                </div>
                <div class="form-check mb-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="familyDiabetes"
                    name="familyHistory.diabetes"
                  />
                  <label class="form-check-label" for="familyDiabetes"
                    >Diabetes</label
                  >
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-check mb-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="familyAutoimmune"
                    name="familyHistory.autoimmune"
                  />
                  <label class="form-check-label" for="familyAutoimmune"
                    >Autoimmune Disorders</label
                  >
                </div>
                <div class="form-check mb-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="familyMentalHealth"
                    name="familyHistory.mentalHealth"
                  />
                  <label class="form-check-label" for="familyMentalHealth"
                    >Mental Health Conditions</label
                  >
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Other Family Conditions</label>
              <textarea
                class="form-control"
                name="familyHistory.other"
                rows="2"
                placeholder="List any other significant family health conditions"
              ></textarea>
            </div>
          </div>

          <!-- Social Determinants of Health -->
          <div class="screening-section mb-5">
            <h5 class="section-title">
              <i class="fas fa-home text-info me-2"></i>
              Social Determinants of Health
            </h5>
            <p class="text-muted mb-3">
              Your social environment can impact your health. This information
              helps us provide appropriate support.
            </p>

            <div class="mb-3">
              <label class="form-label">Race/Ethnicity</label>
              <select class="form-select" name="sdoh.race">
                <option value="">Select...</option>
                <option value="Asian">Asian</option>
                <option value="Black/African American">
                  Black/African American
                </option>
                <option value="Hispanic/Latino">Hispanic/Latino</option>
                <option value="Native American">Native American</option>
                <option value="Pacific Islander">Pacific Islander</option>
                <option value="White/Caucasian">White/Caucasian</option>
                <option value="Multiple">Multiple Races</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Highest Education Level</label>
              <select class="form-select" name="sdoh.education">
                <option value="">Select...</option>
                <option value="Less than high school">
                  Less than high school
                </option>
                <option value="High school/GED">High school/GED</option>
                <option value="Some college">Some college</option>
                <option value="Associate's degree">Associate's degree</option>
                <option value="Bachelor's degree">Bachelor's degree</option>
                <option value="Graduate degree">Graduate degree</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Housing Situation</label>
              <select class="form-select" name="sdoh.housing">
                <option value="">Select...</option>
                <option value="Own home">Own home</option>
                <option value="Rent">Rent</option>
                <option value="Live with family/friends">
                  Live with family/friends
                </option>
                <option value="Supportive housing">Supportive housing</option>
                <option value="Unstable housing">Unstable housing</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Healthcare Access</label>
              <select class="form-select" name="sdoh.healthcareAccess">
                <option value="">Select...</option>
                <option value="Private insurance">Private insurance</option>
                <option value="Medicare">Medicare</option>
                <option value="Medicaid">Medicaid</option>
                <option value="No insurance">No insurance</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Employment Status</label>
              <select class="form-select" name="sdoh.employmentStatus">
                <option value="">Select...</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Retired">Retired</option>
                <option value="Student">Student</option>
                <option value="Unable to work">Unable to work</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Food Security</label>
              <select class="form-select" name="sdoh.foodSecurity">
                <option value="">Select...</option>
                <option value="Always have enough food">
                  Always have enough food
                </option>
                <option value="Sometimes worry about food">
                  Sometimes worry about food
                </option>
                <option value="Often worry about food">
                  Often worry about food
                </option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Transportation Access</label>
              <select class="form-select" name="sdoh.transportationAccess">
                <option value="">Select...</option>
                <option value="Own vehicle">Own vehicle</option>
                <option value="Public transportation">
                  Public transportation
                </option>
                <option value="Rely on others">Rely on others</option>
                <option value="Limited access">Limited access</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Social Support Network</label>
              <select class="form-select" name="sdoh.socialSupport">
                <option value="">Select...</option>
                <option value="Strong support network">
                  Strong support network
                </option>
                <option value="Some support">Some support</option>
                <option value="Limited support">Limited support</option>
                <option value="Very isolated">Very isolated</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="screening-section mb-5">
            <h5 class="section-title">
              <i class="fas fa-info-circle text-warning me-2"></i>
              Additional Information
            </h5>

            <div class="mb-3">
              <label class="form-label"
                >Is there anything else you'd like us to know about your
                health?</label
              >
              <textarea
                class="form-control"
                name="additionalInfo"
                rows="3"
                placeholder="Enter any additional health information here"
              ></textarea>
            </div>
          </div>

          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary btn-lg">
              <i class="fas fa-check-circle me-2"></i>Submit Screening
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>

<div id="analysis-result" style="display: none">
  <div class="card mb-4">
    <div class="card-body">
      <h5 class="card-title mb-4">
        <i class="fas fa-chart-pie text-primary me-2"></i>
        Health Risk Assessment
      </h5>

      <div class="alert" id="risk-alert" role="alert">
        <h6 class="alert-heading mb-2" id="risk-level"></h6>
        <p class="mb-0" id="risk-explanation"></p>
      </div>

      <div class="mb-4">
        <h6>Potential Health Concerns:</h6>
        <ul id="potential-issues" class="list-group list-group-flush"></ul>
      </div>

      <div>
        <h6>Recommended Next Steps:</h6>
        <div id="recommendations"></div>
      </div>

      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-secondary" id="editBtn">
          <i class="fas fa-edit me-2"></i>Edit Responses
        </button>
        <button class="btn btn-success" id="saveBtn">
          <i class="fas fa-check me-2"></i>Save to My Records
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Loading overlay -->
<div
  id="loading-overlay"
  class="position-fixed top-0 start-0 w-100 h-100 d-none"
>
  <div
    class="d-flex justify-content-center align-items-center h-100 bg-dark bg-opacity-75"
  >
    <div class="text-center text-white">
      <div
        class="spinner-border text-light mb-3"
        role="status"
        style="width: 3rem; height: 3rem"
      >
        <span class="visually-hidden">Loading...</span>
      </div>
      <h5 id="loading-text">Analyzing your health data...</h5>
      <p class="small">This may take a few moments</p>
    </div>
  </div>
</div>

<!-- Success Modal -->
<div class="modal fade" id="successModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Screening Saved</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>
      </div>
      <div class="modal-body">
        <div class="text-center mb-4">
          <i
            class="fas fa-check-circle text-success"
            style="font-size: 4rem"
          ></i>
          <h5 class="mt-3">Your baseline screening has been saved</h5>
          <p class="text-muted">
            The results are now available on your dashboard
          </p>
        </div>
      </div>
      <div class="modal-footer">
        <a href="/patient/dashboard" class="btn btn-primary">
          Go to Dashboard
        </a>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Close
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .screening-section {
    border: 1px solid #e9ecef;
    border-radius: 10px;
    padding: 2rem;
    margin-bottom: 2rem;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.5s ease forwards;
  }

  .screening-section:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-color: #dee2e6;
  }

  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 2rem;
    transition: all 0.3s ease;
  }

  .section-title:hover {
    background: #e9ecef;
    transform: translateX(5px);
  }

  .section-title i {
    font-size: 1.5rem;
    margin-right: 15px;
  }

  .form-control,
  .form-select {
    border-radius: 8px;
    transition: all 0.3s ease;
    max-width: 600px;
  }

  .form-control:focus,
  .form-select:focus {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .tag {
    background: #e9ecef;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    transition: all 0.2s ease;
    cursor: default;
  }

  .tag:hover {
    background: #dee2e6;
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  #loading-overlay {
    z-index: 2000;
  }

  #potential-issues .list-group-item {
    border-left: none;
    border-right: none;
    padding: 0.75rem 0;
  }

  .issue-item {
    display: flex;
    align-items: flex-start;
  }

  .issue-item i {
    margin-top: 3px;
    margin-right: 10px;
  }

  .progress-bar-container {
    position: sticky;
    top: 0;
    z-index: 1020;
    background: white;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .btn-primary {
    transition: all 0.3s ease;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(13, 110, 253, 0.2);
  }
</style>

<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js"></script>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    // Tag input functionality
    const tagInputs = [
      {
        inputId: "medicationInput",
        tagContainerId: "currentMedicationTags",
        hiddenInputId: "currentMedications",
      },
      {
        inputId: "allergyInput",
        tagContainerId: "medicationAllergyTags",
        hiddenInputId: "medicationAllergies",
      },
      {
        inputId: "conditionInput",
        tagContainerId: "chronicConditionTags",
        hiddenInputId: "chronicConditions",
      },
      {
        inputId: "surgeryInput",
        tagContainerId: "pastSurgeryTags",
        hiddenInputId: "pastSurgeries",
      },
      {
        inputId: "mentalHealthInput",
        tagContainerId: "mentalHealthTags",
        hiddenInputId: "mentalHealthConditions",
      },
    ];

    // Set up tag inputs
    tagInputs.forEach(({ inputId, tagContainerId, hiddenInputId }) => {
      const inputElement = document.getElementById(inputId);
      const tagContainer = document.getElementById(tagContainerId);
      const hiddenInput = document.getElementById(hiddenInputId);
      let tags = [];

      inputElement.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          const value = this.value.trim();
          if (value && !tags.includes(value)) {
            addTag(value);
            this.value = "";
            updateHiddenInput();
          }
        }
      });

      function addTag(text) {
        tags.push(text);
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.innerHTML = text + ' <span class="remove-tag">&times;</span>';
        tagContainer.appendChild(tag);

        tag.querySelector(".remove-tag").addEventListener("click", function () {
          tag.remove();
          tags = tags.filter((t) => t !== text);
          updateHiddenInput();
        });
      }

      function updateHiddenInput() {
        hiddenInput.value = JSON.stringify(tags);
      }
    });

    // Form submission
    const screeningForm = document.getElementById("screeningForm");
    const loadingOverlay = document.getElementById("loading-overlay");
    const analysisResult = document.getElementById("analysis-result");

    screeningForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Show loading overlay
      loadingOverlay.classList.remove("d-none");

      // Gather form data
      const formData = new FormData(screeningForm);
      const jsonData = {};

      // Convert FormData to JSON
      formData.forEach((value, key) => {
        // Handle nested properties like familyHistory.cancer
        if (key.includes(".")) {
          const [parent, child] = key.split(".");
          if (!jsonData[parent]) {
            jsonData[parent] = {};
          }
          jsonData[parent][child] = value === "on" ? true : value;
        } else {
          // Try to parse JSON strings (for tag inputs)
          try {
            if (value.startsWith("[") && value.endsWith("]")) {
              jsonData[key] = JSON.parse(value);
            } else {
              jsonData[key] = value;
            }
          } catch (error) {
            jsonData[key] = value;
          }
        }
      });

      // Send data to server for analysis
      fetch("/api/baseline-screening/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            displayResults(data.analysis);
            loadingOverlay.classList.add("d-none");
            analysisResult.style.display = "block";

            // Scroll to results
            analysisResult.scrollIntoView({ behavior: "smooth" });
          } else {
            loadingOverlay.classList.add("d-none");
            alert("Error: " + data.message);
          }
        })
        .catch((error) => {
          loadingOverlay.classList.add("d-none");
          console.error("Error:", error);
          alert("An error occurred during submission.");
        });
    });

    // Display risk assessment results
    function displayResults(analysis) {
      const riskAlert = document.getElementById("risk-alert");
      const riskLevel = document.getElementById("risk-level");
      const riskExplanation = document.getElementById("risk-explanation");
      const potentialIssues = document.getElementById("potential-issues");
      const recommendations = document.getElementById("recommendations");

      // Set risk level and color
      riskLevel.textContent = analysis.riskLevel + " Risk";
      riskExplanation.textContent = analysis.analysisExplanation;

      // Set alert color based on risk level
      riskAlert.className = "alert";
      switch (analysis.riskLevel) {
        case "Low":
          riskAlert.classList.add("alert-success");
          break;
        case "Medium":
          riskAlert.classList.add("alert-warning");
          break;
        case "High":
          riskAlert.classList.add("alert-danger");
          break;
      }

      // Display potential issues
      potentialIssues.innerHTML = "";
      analysis.possibleIssues.forEach((issue) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.innerHTML = `
          <div class="issue-item">
            <i class="fas fa-exclamation-circle text-warning"></i>
            <div>${issue}</div>
          </div>
        `;
        potentialIssues.appendChild(li);
      });

      // Display recommendations
      recommendations.innerHTML = "";
      const recommendationsList = [
        "Schedule a follow-up appointment with your doctor to discuss these results",
        "Consider additional screenings based on your risk factors",
        "Update your medical records with any new information",
        "Discuss medication adjustments with your healthcare provider",
      ];

      const ul = document.createElement("ul");
      ul.className = "list-group list-group-flush";
      recommendationsList.forEach((rec) => {
        const li = document.createElement("li");
        li.className = "list-group-item px-0";
        li.innerHTML = `
          <div class="d-flex align-items-start">
            <i class="fas fa-check-circle text-success me-2 mt-1"></i>
            <div>${rec}</div>
          </div>
        `;
        ul.appendChild(li);
      });
      recommendations.appendChild(ul);
    }

    // Edit button functionality
    document.getElementById("editBtn").addEventListener("click", function () {
      analysisResult.style.display = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Save button functionality
    document.getElementById("saveBtn").addEventListener("click", function () {
      // Show success modal
      const successModal = new bootstrap.Modal(
        document.getElementById("successModal")
      );
      successModal.show();
    });

    // Add this to your existing script
    function updateProgress() {
      const form = document.getElementById("screeningForm");
      const inputs = form.querySelectorAll(
        'input:not([type="hidden"]), select, textarea'
      );
      const totalInputs = inputs.length;
      let filledInputs = 0;

      inputs.forEach((input) => {
        if (input.type === "checkbox" && input.checked) filledInputs++;
        else if (input.value.trim() !== "") filledInputs++;
      });

      const percentage = Math.round((filledInputs / totalInputs) * 100);
      document.querySelector(".progress-bar").style.width = `${percentage}%`;
      document.getElementById("progressPercentage").textContent = percentage;
    }

    // Add input event listeners
    document.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("input", updateProgress);
      input.addEventListener("change", updateProgress);
    });
  });
</script>

<%- include('../../partials/footer') %>

```

### views\pages\patient\care-plan.ejs
```

```

### views\pages\patient\dashboard.ejs
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Patient Dashboard - MedConnect</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      rel="stylesheet"
    />
    <!-- Add AOS (Animate On Scroll) for animations -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet" />
    <!-- Patient Theme CSS -->
    <link href="/css/patient-theme.css" rel="stylesheet" />
    <style>
      :root {
        --primary-blue: #2a5c82;
        --secondary-blue: #5c9baf;
        --accent-teal: #4ecdc4;
      }

      .dashboard-header {
        background: var(--primary-blue);
        color: white;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1030;
        height: 60px;
      }

      .sidebar {
        background: #f8f9fa;
        position: fixed;
        left: 0;
        top: 60px;
        bottom: 0;
        width: 250px;
        border-right: 1px solid #dee2e6;
        overflow-y: auto;
        z-index: 1020;
        padding: 20px 0;
      }

      .main-content {
        margin-left: 250px;
        margin-top: 60px;
        padding: 30px;
        min-height: calc(100vh - 60px);
      }

      .nav-link {
        color: #333;
        padding: 0.8rem 1.5rem;
        margin: 0.2rem 1rem;
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .nav-link:hover {
        background: var(--accent-teal);
        color: white !important;
      }

      .nav-link.active {
        background: var(--primary-blue);
        color: white !important;
      }

      .welcome-card {
        background: linear-gradient(
          135deg,
          var(--secondary-blue),
          var(--accent-teal)
        );
        color: white;
        border-radius: 15px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .card {
        border: none;
        border-radius: 15px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
      }

      .card:hover {
        transform: translateY(-5px);
      }

      .risk-badge {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .risk-low {
        background-color: #198754;
      }

      .risk-medium {
        background-color: #fd7e14;
      }

      .risk-high {
        background-color: #dc3545;
      }

      .health-concern-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .health-concern-item:last-child {
        margin-bottom: 0;
      }

      .concern-icon {
        margin-right: 8px;
        font-size: 14px;
      }

      .concern-text {
        font-size: 14px;
        line-height: 1.4;
      }

      .empty-state {
        color: #dee2e6;
      }
    </style>
  </head>
  <body>
    <!-- Fixed Header -->
    <header class="dashboard-header py-2">
      <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center logo">
            <i class="fas fa-hospital"></i>
            <h4 class="mb-0">MedConnect</h4>
          </div>
          <div class="d-flex align-items-center">
            <span class="me-3 user-welcome"
              ><i class="fas fa-user-circle me-2"></i>Welcome, <%= user.fullName
              %></span
            >
            <a href="/logout" class="btn btn-logout">Logout</a>
          </div>
        </div>
      </div>
    </header>

    <!-- Fixed Sidebar -->
    <div class="sidebar">
      <nav class="nav flex-column">
        <a
          href="/patient/dashboard"
          class="nav-link <%= locals.path === '/patient/dashboard' ? 'active' : '' %>"
        >
          <i class="fas fa-home"></i> Dashboard
        </a>
        <a
          href="/patient/appointments"
          class="nav-link <%= locals.path === '/patient/appointments' ? 'active' : '' %>"
        >
          <i class="fas fa-calendar"></i> Appointments
        </a>
        <a
          href="/patient/medical-records"
          class="nav-link <%= locals.path === '/patient/medical-records' ? 'active' : '' %>"
        >
          <i class="fas fa-file-medical"></i> Medical Records
        </a>
        <a
          href="#"
          class="nav-link <%= locals.path === '/patient/messages' ? 'active' : '' %>"
        >
          <i class="fas fa-comments"></i> Messages
        </a>
        <a
          href="#"
          class="nav-link <%= locals.path === '/patient/navigator' ? 'active' : '' %>"
        >
          <i class="fas fa-user-md"></i> My Navigator
        </a>
      </nav>
    </div>

    <!-- Main Content -->
    <main class="main-content">
      <div class="container-fluid">
        <!-- Welcome Card -->
        <div class="row mb-4" data-aos="fade-up" data-aos-duration="800">
          <div class="col-12">
            <div class="welcome-card p-4">
              <div class="d-flex align-items-center">
                <div class="me-4">
                  <i class="fas fa-hand-sparkles fa-3x"></i>
                </div>
                <div>
                  <h4 class="mb-1">
                    Hello, <%= user.fullName.split(' ')[0] %>!
                  </h4>
                  <p class="mb-0">
                    Welcome to your health dashboard. Let's take care of your
                    wellbeing today!
                  </p>
                </div>
                <div class="ms-auto d-none d-md-block">
                  <img
                    src="https://img.icons8.com/color/96/000000/healthcare-and-medical.png"
                    width="80"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Health Risk Assessment -->
        <div class="row">
          <div
            class="col-md-6 mb-4"
            data-aos="fade-right"
            data-aos-duration="800"
            data-aos-delay="100"
          >
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">
                  <i class="fas fa-chart-line"></i>
                  Health Risk Assessment
                </h5>

                <div id="riskAssessmentLoading" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="mt-2 text-muted">Loading your risk assessment...</p>
                </div>

                <div
                  id="noRiskAssessment"
                  class="text-center py-4"
                  style="display: none"
                >
                  <div class="empty-state mb-3">
                    <img
                      src="https://img.icons8.com/color/96/000000/health-checkup.png"
                      width="80"
                    />
                  </div>
                  <h6>No Health Risk Assessment</h6>
                  <p class="text-muted mb-3">
                    Complete a baseline health screening to get personalized
                    insights.
                  </p>
                  <a href="/baseline-screening" class="btn btn-primary">
                    <i class="fas fa-plus-circle me-1"></i>
                    Complete Screening
                  </a>
                </div>

                <div id="riskAssessmentContent" style="display: none">
                  <div class="d-flex align-items-center mb-3">
                    <div id="riskLevelIndicator" class="me-3 risk-badge">
                      <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                      <h6 id="riskLevelText" class="mb-0">Risk Level</h6>
                      <small class="text-muted"
                        >Based on your most recent screening</small
                      >
                    </div>
                  </div>

                  <div class="card mb-3 bg-light border-0">
                    <div class="card-body p-3">
                      <h6 class="card-subtitle mb-3">Key Health Concerns</h6>
                      <ul id="healthConcernsList" class="list-unstyled mb-0">
                        <!-- Issues will be populated here -->
                      </ul>
                    </div>
                  </div>

                  <p id="analysisText" class="text-muted small mb-3"></p>

                  <div
                    class="d-flex justify-content-between align-items-center"
                  >
                    <small id="screeningDate" class="text-muted"></small>
                    <a
                      href="/baseline-screening"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="fas fa-redo me-1"></i>
                      New Screening
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Medical Records -->
          <div
            class="col-md-6 mb-4"
            data-aos="fade-left"
            data-aos-duration="800"
            data-aos-delay="200"
          >
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">
                  <i class="fas fa-file-medical"></i>
                  Medical Records
                </h5>
                <div class="text-center mb-4">
                  <img
                    src="https://img.icons8.com/color/96/000000/treatment-plan.png"
                    width="80"
                    class="my-3"
                  />
                  <p class="card-text text-muted">
                    Securely upload and manage your health documents in one
                    place.
                  </p>
                </div>
                <div class="d-grid">
                  <a href="/patient/medical-records" class="btn btn-primary">
                    <i class="fas fa-folder-open me-1"></i>
                    View Medical Records
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Appointments -->
        <div class="row">
          <div
            class="col-md-6 mb-4"
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="300"
          >
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">
                  <i class="fas fa-calendar-check"></i>
                  Upcoming Appointments
                </h5>
                <div class="text-center my-4">
                  <img
                    src="https://img.icons8.com/color/96/000000/doctors-bag.png"
                    width="70"
                  />
                  <p class="card-text text-muted mt-3">
                    No upcoming appointments scheduled.
                  </p>
                </div>
                <div class="d-grid">
                  <button class="btn btn-outline-primary">
                    <i class="fas fa-plus-circle me-1"></i>
                    Schedule Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Care Team -->
          <div
            class="col-md-6 mb-4"
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="400"
          >
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">
                  <i class="fas fa-user-md"></i>
                  Your Care Team
                </h5>
                <div class="text-center my-4">
                  <img
                    src="https://img.icons8.com/color/96/000000/medical-doctor.png"
                    width="70"
                  />
                  <p class="card-text text-muted mt-3">
                    Connect with healthcare professionals dedicated to your
                    care.
                  </p>
                </div>
                <div class="d-grid">
                  <button class="btn btn-outline-primary">
                    <i class="fas fa-search me-1"></i>
                    Find Providers
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Add AOS JS -->
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
      // Initialize AOS animation
      AOS.init({
        once: true,
      });

      document.addEventListener("DOMContentLoaded", function () {
        // Fetch the latest risk assessment
        fetch("/api/baseline-screening/latest")
          .then((response) => response.json())
          .then((data) => {
            // Hide loading spinner
            document.getElementById("riskAssessmentLoading").style.display =
              "none";

            if (data.success && data.screening) {
              // Show risk assessment content
              document.getElementById("riskAssessmentContent").style.display =
                "block";

              // Get risk assessment data
              const assessment = data.screening.riskAssessment;

              // Display risk level
              const riskLevelIndicator =
                document.getElementById("riskLevelIndicator");
              const riskLevelText = document.getElementById("riskLevelText");

              riskLevelText.textContent = `${assessment.riskLevel} Risk Level`;

              if (assessment.riskLevel === "Low") {
                riskLevelIndicator.className = "me-3 risk-badge risk-low";
                riskLevelIndicator.innerHTML = '<i class="fas fa-check"></i>';
              } else if (assessment.riskLevel === "Medium") {
                riskLevelIndicator.className = "me-3 risk-badge risk-medium";
                riskLevelIndicator.innerHTML =
                  '<i class="fas fa-exclamation"></i>';
              } else {
                riskLevelIndicator.className = "me-3 risk-badge risk-high";
                riskLevelIndicator.innerHTML =
                  '<i class="fas fa-exclamation-triangle"></i>';
              }

              // Display health concerns
              const healthConcernsList =
                document.getElementById("healthConcernsList");
              healthConcernsList.innerHTML = "";

              if (
                assessment.possibleIssues &&
                assessment.possibleIssues.length > 0
              ) {
                assessment.possibleIssues.forEach((issue) => {
                  const li = document.createElement("li");
                  li.className = "health-concern-item";

                  let iconClass = "text-success";
                  if (issue.toLowerCase().includes("high")) {
                    iconClass = "text-danger";
                  } else if (
                    issue.toLowerCase().includes("moderate") ||
                    issue.toLowerCase().includes("medium")
                  ) {
                    iconClass = "text-warning";
                  }

                  li.innerHTML = `
                                    <span class="concern-icon ${iconClass}"><i class="fas fa-circle"></i></span>
                                    <span class="concern-text">${issue}</span>
                                `;

                  healthConcernsList.appendChild(li);
                });
              } else {
                const li = document.createElement("li");
                li.className = "health-concern-item";
                li.innerHTML = `
                                <span class="concern-icon text-success"><i class="fas fa-check-circle"></i></span>
                                <span class="concern-text">No significant health concerns identified</span>
                            `;
                healthConcernsList.appendChild(li);
              }

              // Display analysis text
              document.getElementById("analysisText").textContent =
                assessment.analysisExplanation;

              // Display screening date
              const screeningDate = new Date(
                data.screening.createdAt
              ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              document.getElementById(
                "screeningDate"
              ).textContent = `Last updated: ${screeningDate}`;
            } else {
              // Show no assessment message
              document.getElementById("noRiskAssessment").style.display =
                "block";
            }
          })
          .catch((error) => {
            console.error("Error fetching risk assessment:", error);
            document.getElementById("riskAssessmentLoading").style.display =
              "none";
            document.getElementById("noRiskAssessment").style.display = "block";
          });
      });
    </script>

    <!-- Chatbot CSS and JavaScript -->
    <link href="/css/chatbot-styles.css" rel="stylesheet" />
    <script src="/js/chatbot.js"></script>
  </body>
</html>

```

### views\pages\patient\feedback.ejs
```

```

### views\pages\patient\medical-insights.ejs
```

```

### views\pages\patient\medical-records.ejs
```
<%- include('../../partials/header') %>

<div class="row">
  <!-- Page Title -->
  <div class="col-12 mb-4" data-aos="fade-up" data-aos-duration="800">
    <div class="d-flex align-items-center">
      <div class="me-3">
        <span class="display-6" style="color: var(--primary-blue);">
          <i class="fas fa-folder-open"></i>
        </span>
      </div>
      <div>
        <h3 class="mb-1">Medical Records</h3>
        <p class="text-muted mb-0">Manage and organize your health documents</p>
      </div>
    </div>
  </div>

  <!-- Upload Section -->
  <div class="col-md-5 col-lg-4" data-aos="fade-right" data-aos-duration="800" data-aos-delay="100">
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title mb-4">
          <i class="fas fa-upload"></i>
          Upload Medical Record
        </h5>
        <form id="uploadForm" enctype="multipart/form-data" class="px-2">
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" name="title" required placeholder="Enter record title" />
          </div>
          <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea
              class="form-control"
              name="description"
              rows="3"
              required
              placeholder="Enter brief description of the record"
            ></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Record Type</label>
            <select class="form-select" name="recordType" required>
              <option value="">Select Type</option>
              <option value="Prescription">Prescription</option>
              <option value="Lab Report">Lab Report</option>
              <option value="Imaging">Imaging</option>
              <option value="Discharge Summary">Discharge Summary</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Record Date</label>
            <input
              type="date"
              class="form-control"
              name="recordDate"
              required
            />
          </div>
          <div class="mb-3">
            <label class="form-label">File</label>
            <div class="file-upload-wrapper">
              <input
                type="file"
                class="form-control"
                name="file"
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
              <small class="text-muted mt-1 d-block">
                <i class="fas fa-info-circle me-1"></i>
                Supported formats: PDF, JPG, PNG (Max 10MB)
              </small>
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-100">
            <i class="fas fa-upload me-2"></i>Upload Record
          </button>
        </form>
      </div>
    </div>

    <!-- Search & Filter Section -->
    <div class="card mb-4" data-aos="fade-right" data-aos-duration="800" data-aos-delay="200">
      <div class="card-body">
        <h5 class="card-title mb-4">
          <i class="fas fa-search"></i>
          Search & Filter
        </h5>

        <!-- Search Bar -->
        <div class="mb-3">
          <div class="input-group">
            <input
              type="text"
              id="searchInput"
              class="form-control"
              placeholder="Search records..."
            />
            <button class="btn btn-primary" type="button" id="searchButton">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>

        <!-- Filter Buttons -->
        <div class="filter-buttons">
          <div class="d-flex flex-wrap gap-2 mb-2">
            <button
              class="btn btn-sm btn-outline-primary rounded-pill filter-btn active"
              data-filter="all"
            >
              All Records
            </button>
            <button
              class="btn btn-sm btn-outline-primary rounded-pill filter-btn"
              data-filter="Prescription"
            >
              Prescriptions
            </button>
            <button
              class="btn btn-sm btn-outline-primary rounded-pill filter-btn"
              data-filter="Lab Report"
            >
              Lab Reports
            </button>
            <button
              class="btn btn-sm btn-outline-primary rounded-pill filter-btn"
              data-filter="Imaging"
            >
              Imaging
            </button>
            <button
              class="btn btn-sm btn-outline-primary rounded-pill filter-btn"
              data-filter="Discharge Summary"
            >
              Discharge Summaries
            </button>
            <button
              class="btn btn-sm btn-outline-primary rounded-pill filter-btn"
              data-filter="Other"
            >
              Other
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Records List Section -->
  <div class="col-md-8">
    <div class="card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="card-title mb-0">
            <i class="fas fa-file-medical text-primary me-2"></i>My Medical Records
          </h5>
          <span class="badge rounded-pill bg-primary" id="recordCount">0 Records</span>
        </div>

        <!-- Search Results Section (Initially Hidden) -->
        <div id="searchResultsSection" style="display: none">
          <h6 class="border-bottom pb-2 mb-3">
            Search Results
            <span id="searchResultsCount" class="text-muted">(0 results)</span>
          </h6>
          <div id="searchResults" class="list-group mb-4">
            <!-- Search results will be populated here -->
          </div>
          <button id="clearSearch" class="btn btn-sm btn-outline-secondary mb-4">
            <i class="fas fa-times me-2"></i>Clear Search
          </button>
        </div>

        <!-- All Records List -->
        <div id="recordsList" class="list-group">
          <!-- Records will be populated here -->
          <div class="text-center py-5 text-muted" id="noRecords">
            <i class="fas fa-folder-open fa-3x mb-3"></i>
            <p>No records found. Upload your first medical record!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Medical Records Chat Interface -->
    <div class="card">
      <div class="card-header bg-primary text-white">
        <div class="d-flex align-items-center">
          <i class="fas fa-robot me-2"></i>
          <h5 class="mb-0">Medical Records Assistant</h5>
        </div>
      </div>
      <div class="card-body">
        <div class="mb-3 chat-container" style="height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 5px; padding: 15px;">
          <div id="medicalRecordChatMessages">
            <div class="p-3 bg-light rounded mb-3">
              <i class="fas fa-robot text-primary me-2"></i>
              <span>Hello! I can help answer questions about your medical records. Try asking things like "What medications am I taking?" or "What were the results of my last blood test?"</span>
            </div>
          </div>
        </div>
        <form id="medicalRecordChatForm" class="d-flex">
          <input type="text" id="medicalRecordQuestion" class="form-control me-2" placeholder="Ask a question about your medical records...">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  </div>
</div>

<!-- Edit Record Modal -->
<div class="modal fade" id="editRecordModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Edit Medical Record</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>
      </div>
      <div class="modal-body">
        <form id="editForm" class="px-2" enctype="multipart/form-data">
          <input type="hidden" id="editRecordId" />
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" id="editTitle" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea
              class="form-control"
              id="editDescription"
              rows="3"
              required
            ></textarea>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Record Type</label>
              <select class="form-select" id="editRecordType" required>
                <option value="Prescription">Prescription</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Imaging">Imaging</option>
                <option value="Discharge Summary">Discharge Summary</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Record Date</label>
              <input
                type="date"
                class="form-control"
                id="editRecordDate"
                required
              />
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Update File</label>
            <input
              type="file"
              class="form-control"
              id="editFile"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <small class="text-muted">Leave empty to keep existing file</small>
          </div>
          <div class="mb-3">
            <label class="form-label">Current File</label>
            <div id="currentFilePreview" class="border rounded p-2">
              <div class="d-flex align-items-center">
                <i class="fas fa-file me-2"></i>
                <span id="currentFileName">No file selected</span>
              </div>
              <div id="filePreviewContent" class="mt-2"></div>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button type="button" class="btn btn-primary" id="updateRecord">
          Update Record
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deleteRecordModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Confirm Delete</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete this medical record?</p>
        <p class="text-danger">This action cannot be undone.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button type="button" class="btn btn-danger" id="confirmDelete">
          Delete Record
        </button>
      </div>
    </div>
  </div>
</div>

<!-- View Record Modal -->
<div class="modal fade" id="viewRecordModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="viewRecordTitle"></h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>
      </div>
      <div class="modal-body">
        <div class="row mb-3">
          <div class="col-md-6">
            <p>
              <strong>Type:</strong>
              <span class="badge rounded-pill" id="viewRecordType"></span>
            </p>
            <p>
              <strong>Record Date:</strong>
              <span id="viewRecordDate"></span>
            </p>
            <p>
              <strong>Upload Date:</strong>
              <span id="viewUploadDate"></span>
            </p>
          </div>
          <div class="col-md-6">
            <p>
              <strong>Description:</strong>
            </p>
            <p id="viewDescription"></p>
          </div>
        </div>
        <div class="text-center" id="viewRecordFile"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Close
        </button>
        <a
          href="#"
          class="btn btn-primary"
          id="downloadRecordBtn"
          target="_blank"
        >
          <i class="fas fa-download me-2"></i>Download
        </a>
      </div>
    </div>
  </div>
</div>

<!-- Bootstrap Bundle with Popper -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    const uploadForm = document.getElementById("uploadForm");
    const recordsList = document.getElementById("recordsList");
    const noRecords = document.getElementById("noRecords");
    const recordCount = document.getElementById("recordCount");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const clearSearch = document.getElementById("clearSearch");
    const searchResults = document.getElementById("searchResults");
    const searchResultsSection = document.getElementById(
      "searchResultsSection"
    );
    const searchResultsCount = document.getElementById("searchResultsCount");
    const filterButtons = document.querySelectorAll(".filter-btn");

    let records = [];
    let currentFilter = "all";
    let currentRecordId = null;

    // Load records when page loads
    fetchRecords();

    // Handle form submission
    uploadForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const formData = new FormData(uploadForm);

      // Show loading
      Swal.fire({
        title: "Uploading...",
        text: "Please wait while we upload your record.",
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      fetch("/api/medical-records/upload", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: data.message,
            });
            uploadForm.reset();
            fetchRecords();
          } else {
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: data.message,
            });
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: "An error occurred during upload.",
          });
        });
    });

    // Fetch records function
    function fetchRecords() {
      fetch("/api/medical-records")
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            records = data.records;
            updateRecordsList();
          } else {
            console.error("Error fetching records:", data.message);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }

    // Update records list function
    function updateRecordsList() {
      // Update record count
      recordCount.textContent = `${records.length} Records`;

      // Filter records if needed
      let filteredRecords = records;
      if (currentFilter !== "all") {
        filteredRecords = records.filter(
          (record) => record.recordType === currentFilter
        );
      }

      // Clear the list
      recordsList.innerHTML = "";

      // Update UI based on records
      if (filteredRecords.length === 0) {
        noRecords.style.display = "block";
      } else {
        noRecords.style.display = "none";

        // Add records to list
        filteredRecords.forEach((record) => {
          // Create record item
          const recordItem = createRecordItem(record);
          recordsList.appendChild(recordItem);
        });
      }
    }

    // Create record item function
    function createRecordItem(record) {
      const recordDate = new Date(record.recordDate).toLocaleDateString();
      const uploadDate = new Date(record.uploadDate).toLocaleDateString();

      // Get badge class based on record type
      let badgeClass = "bg-secondary";
      switch (record.recordType) {
        case "Prescription":
          badgeClass = "bg-info";
          break;
        case "Lab Report":
          badgeClass = "bg-success";
          break;
        case "Imaging":
          badgeClass = "bg-warning";
          break;
        case "Discharge Summary":
          badgeClass = "bg-primary";
          break;
      }

      // Create record item element
      const div = document.createElement("div");
      div.className = "list-group-item list-group-item-action";
      div.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
          <h6 class="mb-1">${record.title}</h6>
          <span class="badge ${badgeClass}">${record.recordType}</span>
        </div>
        <p class="mb-1 text-truncate">${record.description}</p>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">Date: ${recordDate}</small>
          <div>
            <button class="btn btn-sm btn-outline-primary view-btn" data-id="${record._id}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary edit-btn" data-id="${record._id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${record._id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      // Add event listeners for buttons
      div.querySelector(".view-btn").addEventListener("click", function () {
        viewRecord(record);
      });

      div.querySelector(".edit-btn").addEventListener("click", function () {
        openEditModal(record);
      });

      div.querySelector(".delete-btn").addEventListener("click", function () {
        openDeleteModal(record._id);
      });

      return div;
    }

    // Handle filter buttons
    filterButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Remove active class from all buttons
        filterButtons.forEach((btn) => btn.classList.remove("active"));

        // Add active class to clicked button
        this.classList.add("active");

        // Update filter
        currentFilter = this.getAttribute("data-filter");

        // Update records list
        updateRecordsList();
      });
    });

    // Handle search
    searchButton.addEventListener("click", function () {
      const query = searchInput.value.trim();
      if (query) {
        searchRecords(query);
      }
    });

    // Search on Enter key
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          searchRecords(query);
        }
      }
    });

    // Clear search
    clearSearch.addEventListener("click", function () {
      searchInput.value = "";
      searchResultsSection.style.display = "none";
      updateRecordsList();
    });

    // Search records function
    function searchRecords(query) {
      fetch(`/api/medical-records/search?query=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            displaySearchResults(data.results);
          } else {
            console.error("Error searching records:", data.message);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }

    // Display search results
    function displaySearchResults(results) {
      searchResults.innerHTML = "";
      searchResultsCount.textContent = `(${results.length} results)`;

      if (results.length === 0) {
        const noResults = document.createElement("div");
        noResults.className = "text-center py-3 text-muted";
        noResults.innerHTML = `
          <p>No records match your search.</p>
        `;
        searchResults.appendChild(noResults);
      } else {
        results.forEach((result) => {
          const record = result.record;
          const recordItem = createRecordItem(record);

          // Add explanation if available
          if (result.explanation) {
            const explanation = document.createElement("div");
            explanation.className = "mt-2 small text-muted";
            explanation.innerHTML = `<i class="fas fa-info-circle me-1"></i> ${result.explanation}`;
            recordItem.appendChild(explanation);
          }

          searchResults.appendChild(recordItem);
        });
      }

      searchResultsSection.style.display = "block";
    }

    // View record function
    function viewRecord(record) {
      const recordDate = new Date(record.recordDate).toLocaleDateString();
      const uploadDate = new Date(record.uploadDate).toLocaleDateString();

      // Get badge class based on record type
      let badgeClass = "bg-secondary";
      switch (record.recordType) {
        case "Prescription":
          badgeClass = "bg-info";
          break;
        case "Lab Report":
          badgeClass = "bg-success";
          break;
        case "Imaging":
          badgeClass = "bg-warning";
          break;
        case "Discharge Summary":
          badgeClass = "bg-primary";
          break;
      }

      // Update modal content
      document.getElementById("viewRecordTitle").textContent = record.title;
      document.getElementById("viewRecordType").textContent = record.recordType;
      document.getElementById(
        "viewRecordType"
      ).className = `badge ${badgeClass}`;
      document.getElementById("viewRecordDate").textContent = recordDate;
      document.getElementById("viewUploadDate").textContent = uploadDate;
      document.getElementById("viewDescription").textContent =
        record.description;

      // Set download link
      document.getElementById("downloadRecordBtn").href = record.fileUrl;

      // Display file
      const fileContainer = document.getElementById("viewRecordFile");
      fileContainer.innerHTML = "";

      if (record.fileUrl.endsWith(".pdf")) {
        // For PDF files, show an embed
        fileContainer.innerHTML = `
          <embed src="${record.fileUrl}" type="application/pdf" width="100%" height="500px" />
        `;
      } else {
        // For images, show an image
        fileContainer.innerHTML = `
          <img src="${record.fileUrl}" class="img-fluid" alt="Medical Record" />
        `;
      }

      // Show modal
      const viewModal = new bootstrap.Modal(
        document.getElementById("viewRecordModal")
      );
      viewModal.show();
    }

    // Open edit modal function
    function openEditModal(record) {
      // Set form values
      document.getElementById("editRecordId").value = record._id;
      document.getElementById("editTitle").value = record.title;
      document.getElementById("editDescription").value = record.description;
      document.getElementById("editRecordType").value = record.recordType;

      // Format date for input field (YYYY-MM-DD)
      const recordDate = new Date(record.recordDate);
      const formattedDate = recordDate.toISOString().split("T")[0];
      document.getElementById("editRecordDate").value = formattedDate;

      // Update file preview
      document.getElementById("currentFileName").textContent = record.title;
      const previewContainer = document.getElementById("filePreviewContent");
      previewContainer.innerHTML = "";

      if (record.fileUrl) {
        if (record.fileUrl.toLowerCase().endsWith(".pdf")) {
          previewContainer.innerHTML = `
            <div class="ratio ratio-16x9" style="max-height: 300px;">
              <embed src="${record.fileUrl}" type="application/pdf" width="100%" height="100%"/>
            </div>
          `;
        } else {
          previewContainer.innerHTML = `
            <img src="${record.fileUrl}" class="img-fluid rounded" style="max-height: 200px;" alt="File preview"/>
          `;
        }
      }

      // Show modal
      const editModal = new bootstrap.Modal(
        document.getElementById("editRecordModal")
      );
      editModal.show();
    }

    // Update record event listener
    document
      .getElementById("updateRecord")
      .addEventListener("click", function () {
        const recordId = document.getElementById("editRecordId").value;
        const title = document.getElementById("editTitle").value;
        const description = document.getElementById("editDescription").value;
        const recordType = document.getElementById("editRecordType").value;
        const recordDate = document.getElementById("editRecordDate").value;

        // Validate form
        if (!title || !description || !recordType || !recordDate) {
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: "Please fill all required fields.",
          });
          return;
        }

        // Update record
        updateRecord(recordId, title, description, recordType, recordDate);
      });

    // Update record function
    function updateRecord(id, title, description, recordType, recordDate) {
      // Show loading indicator
      Swal.fire({
        title: "Updating...",
        text: "Please wait while we update your record.",
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("recordType", recordType);
      formData.append("recordDate", recordDate);

      // Add file if selected
      const fileInput = document.getElementById("editFile");
      if (fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
      }

      fetch(`/api/medical-records/${id}`, {
        method: "PUT",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            const editModal = bootstrap.Modal.getInstance(
              document.getElementById("editRecordModal")
            );
            editModal.hide();

            Swal.fire({
              icon: "success",
              title: "Success!",
              text: data.message,
            });

            fetchRecords();
          } else {
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: data.message,
            });
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: "An error occurred while updating the record.",
          });
        });
    }

    // Open delete modal function
    function openDeleteModal(id) {
      currentRecordId = id;
      const deleteModal = new bootstrap.Modal(
        document.getElementById("deleteRecordModal")
      );
      deleteModal.show();
    }

    // Confirm delete event listener
    document
      .getElementById("confirmDelete")
      .addEventListener("click", function () {
        if (currentRecordId) {
          deleteRecord(currentRecordId);
        }
      });

    // Delete record function
    function deleteRecord(id) {
      // Show loading indicator
      Swal.fire({
        title: "Deleting...",
        text: "Please wait while we delete your record.",
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      fetch(`/api/medical-records/${id}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Close modal
            const deleteModal = bootstrap.Modal.getInstance(
              document.getElementById("deleteRecordModal")
            );
            deleteModal.hide();

            // Show success message
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: data.message,
            });

            // Refresh records
            fetchRecords();
          } else {
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: data.message,
            });
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: "An error occurred while deleting the record.",
          });
        });
    }

    // Add preview for new file selection
    document
      .getElementById("editFile")
      .addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
          document.getElementById("currentFileName").textContent = file.name;
          const previewContainer =
            document.getElementById("filePreviewContent");

          if (file.type === "application/pdf") {
            const url = URL.createObjectURL(file);
            previewContainer.innerHTML = `
            <div class="ratio ratio-16x9" style="max-height: 300px;">
              <embed src="${url}" type="application/pdf" width="100%" height="100%"/>
            </div>
          `;
          } else if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function (e) {
              previewContainer.innerHTML = `
              <img src="${e.target.result}" class="img-fluid rounded" style="max-height: 200px;" alt="File preview"/>
            `;
            };
            reader.readAsDataURL(file);
          }
        }
      });

    // Medical Records Chat functionality
    const medicalRecordChatForm = document.getElementById("medicalRecordChatForm");
    const medicalRecordQuestion = document.getElementById("medicalRecordQuestion");
    const medicalRecordChatMessages = document.getElementById("medicalRecordChatMessages");

    function addChatMessage(message, isUser = false) {
      const messageDiv = document.createElement("div");
      messageDiv.className = `${isUser ? 'text-end' : ''} mb-3`;
      
      const contentDiv = document.createElement("div");
      contentDiv.className = `d-inline-block p-3 rounded ${
        isUser ? 'bg-primary text-white' : 'bg-light'
      }`;
      contentDiv.style.maxWidth = '80%';
      
      if (!isUser) {
        contentDiv.innerHTML = `<i class="fas fa-robot text-primary me-2"></i>`;
      }
      
      contentDiv.innerHTML += message;
      
      messageDiv.appendChild(contentDiv);
      medicalRecordChatMessages.appendChild(messageDiv);
      
      // Scroll to bottom
      const chatContainer = medicalRecordChatMessages.parentElement;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    medicalRecordChatForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const question = medicalRecordQuestion.value.trim();
      
      if (!question) return;
      
      // Add user message
      addChatMessage(question, true);
      medicalRecordQuestion.value = "";
      
      // Add loading message
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "mb-3";
      loadingDiv.innerHTML = `
        <div class="d-inline-block p-3 rounded bg-light">
          <i class="fas fa-robot text-primary me-2"></i>
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Processing your question...
        </div>
      `;
      medicalRecordChatMessages.appendChild(loadingDiv);
      
      // Scroll to bottom
      const chatContainer = medicalRecordChatMessages.parentElement;
      chatContainer.scrollTop = chatContainer.scrollHeight;
      
      try {
        const response = await fetch("/api/medical-records/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        });
        
        const data = await response.json();
        
        // Remove loading message
        medicalRecordChatMessages.removeChild(loadingDiv);
        
        if (data.success) {
          let answer = data.answer;
          if (data.sources && data.sources.length > 0) {
            answer += '<hr class="my-2">';
            answer += '<small class="text-muted">Sources:</small><br>';
            answer += '<small class="text-muted">' + data.sources.join('<br>') + '</small>';
          }
          addChatMessage(answer);
        } else {
          addChatMessage("I'm sorry, I encountered an error processing your question. Please try again.");
        }
      } catch (error) {
        console.error("Error:", error);
        // Remove loading message
        medicalRecordChatMessages.removeChild(loadingDiv);
        addChatMessage("I'm sorry, I encountered an error processing your question. Please try again.");
      }
    });
  });
</script>

<!-- Chatbot CSS and JavaScript -->
<link href="/css/chatbot-styles.css" rel="stylesheet" />
<script src="/js/chatbot.js"></script>
</body>
</html>

```

### views\pages\patient\profile.ejs
```

```

### views\pages\patient\reports.ejs
```

```

### views\pages\patient\resources.ejs
```

```

### views\partials\footer.ejs
```
        </main>
      </div>
    </div>
    
    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <!-- Chatbot JavaScript -->
    <script src="/js/chatbot.js"></script>
  </body>
</html> 
```

### views\partials\header.ejs
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MedConnect</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      rel="stylesheet"
    />
    <!-- Add AOS (Animate On Scroll) for animations -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <!-- Add SweetAlert2 CSS -->
    <link
      href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css"
      rel="stylesheet"
    />
    <!-- Patient Theme CSS - Add our new theme -->
    <link href="/css/patient-theme.css" rel="stylesheet" />
    <!-- Chatbot CSS -->
    <link href="/css/chatbot-styles.css" rel="stylesheet" />
    
    <!-- Add jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- Add AOS JS -->
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <!-- Patient Theme JS -->
    <script src="/js/patient-theme.js"></script>
  </head>
  <body>
    <!-- Fixed Header -->
    <header class="dashboard-header py-2">
      <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center logo">
            <i class="fas fa-hospital me-2"></i>
            <h4 class="mb-0">MedConnect</h4>
          </div>
          <div class="d-flex align-items-center">
            <span class="me-3 user-welcome"><i class="fas fa-user-circle me-2"></i>Welcome, <%= user.fullName %></span>
            <a href="/logout" class="btn btn-logout">Logout</a>
          </div>
        </div>
      </div>
    </header>

    <!-- Fixed Sidebar -->
    <div class="sidebar">
      <nav class="nav flex-column">
        <a
          href="/patient/dashboard"
          class="nav-link <%= locals.path === '/patient/dashboard' ? 'active' : '' %>"
        >
          <i class="fas fa-home"></i> Dashboard
        </a>
        <a
          href="#"
          class="nav-link <%= locals.path === '/patient/appointments' ? 'active' : '' %>"
        >
          <i class="fas fa-calendar"></i> Appointments
        </a>
        <a
          href="/patient/medical-records"
          class="nav-link <%= locals.path === '/patient/medical-records' ? 'active' : '' %>"
        >
          <i class="fas fa-file-medical"></i> Medical Records
        </a>
        <a
          href="/baseline-screening"
          class="nav-link <%= locals.path === '/patient/baseline-screening' ? 'active' : '' %>"
        >
          <i class="fas fa-clipboard-check"></i> Health Screening
        </a>
        <a
          href="#"
          class="nav-link <%= locals.path === '/patient/messages' ? 'active' : '' %>"
        >
          <i class="fas fa-comments"></i> Messages
        </a>
        <a
          href="#"
          class="nav-link <%= locals.path === '/patient/navigator' ? 'active' : '' %>"
        >
          <i class="fas fa-user-md"></i> My Navigator
        </a>
      </nav>
    </div>

    <!-- Main Content Container -->
    <main class="main-content">
  </body>
</html>

```

### views\partials\sidebar.ejs
```
<% if (user.role === 'patient') { %>
<li class="nav-item">
  <a
    href="/patient/dashboard"
    class="nav-link <%= locals.path === '/patient/dashboard' ? 'active' : '' %>"
  >
    <i class="fas fa-tachometer-alt me-2"></i>
    Dashboard
  </a>
</li>
<li class="nav-item">
  <a
    href="/patient/medical-records"
    class="nav-link <%= locals.path === '/patient/medical-records' ? 'active' : '' %>"
  >
    <i class="fas fa-file-medical me-2"></i>
    Medical Records
  </a>
</li>
<li class="nav-item">
  <a
    href="/baseline-screening"
    class="nav-link <%= locals.path === '/patient/baseline-screening' ? 'active' : '' %>"
  >
    <i class="fas fa-clipboard-check me-2"></i>
    Health Screening
  </a>
</li>
<% } %>

```

