from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DB_NAME = "covid_app.db"

# Initialize Database and Tables automatically on startup
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # 1. Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            ic_or_passport TEXT UNIQUE NOT NULL,
            phone_number TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'patient'
        )
    ''')
    
    # 2. Symptom Logs Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS symptom_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            temperature REAL NOT NULL,
            symptoms TEXT NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Run database setup
init_db()

# Authorized Healthcare Facilities & Assessment Centres in Kuala Lumpur
CLINICS_DIRECTORY = [
    {
        "name": "Hospital Kuala Lumpur (HKL)",
        "address": "Jalan Pahang, 50586 Kuala Lumpur",
        "contact": "03-2615 5555",
        "type": "Primary Hospital / Emergency Red Zone",
        "operating_hours": "24 Hours"
    },
    {
        "name": "Tunku Azizah Hospital (Women & Children)",
        "address": "Jalan Pahang, 50586 Kuala Lumpur",
        "contact": "03-2615 3000",
        "type": "Specialist Screening & Treatment Centre",
        "operating_hours": "24 Hours"
    },
    {
        "name": "Universiti Malaya Medical Centre (PPUM)",
        "address": "Jalan Profesor Diraja Ungku Aziz, 59100 Kuala Lumpur",
        "contact": "03-7949 4422",
        "type": "Tertiary Screening & Emergency Department",
        "operating_hours": "24 Hours"
    },
    {
        "name": "Klinik Kesihatan Cheras",
        "address": "Batu 5, Jalan Cheras, 56000 Kuala Lumpur",
        "contact": "03-9130 1033",
        "type": "COVID-19 Assessment Centre (CAC)",
        "operating_hours": "08:00 AM - 05:00 PM"
    }
]

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400
        
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (full_name, ic_or_passport, phone_number, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data.get('full_name'), 
            data.get('ic_or_passport'), 
            data.get('phone_number'), 
            data.get('password'), 
            'patient'
        ))
        conn.commit()
        conn.close()
        return jsonify({"message": "User registered successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "IC or Passport already registered"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400
        
    ic = data.get('ic_or_passport')
    password = data.get('password')
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('SELECT id, full_name, role FROM users WHERE ic_or_passport = ? AND password_hash = ?', (ic, password))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            "message": "Login successful",
            "user_id": user[0],
            "full_name": user[1],
            "role": user[2]
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/symptoms', methods=['POST'])
def submit_symptoms():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400
        
    user_id = data.get('user_id')
    temperature = float(data.get('temperature', 36.5))
    symptoms = data.get('symptoms', [])
    
    if isinstance(symptoms, str):
        symptoms = [s.strip() for s in symptoms.split(',') if s.strip()]

    # 5-Tier Triage Logic based on KKM clinical guidelines
    if 'confusion' in symptoms or 'blue_lips' in symptoms or 'chest_pain' in symptoms or temperature >= 39.5:
        category = "Category 5: Critical"
        severity = "danger"
        advice = "Critical illness with multi-organ failure risk."
        action = "CALL 999 IMMEDIATELY or rush to the nearest Hospital Red Zone. Emergency ambulance dispatch required."
    elif 'severe_breathing_difficulty' in symptoms or temperature >= 39.0:
        category = "Category 4: Severe (Requires Oxygen)"
        severity = "danger"
        advice = "Symptomatic with pneumonia requiring supplemental oxygen."
        action = "Proceed immediately to the Emergency Department / CAC. Do not wait. Bring oxygen support if available."
    elif 'breathing_difficulty_exertion' in symptoms or 'persistent_fever' in symptoms or temperature > 38.5:
        category = "Category 3: Moderate (Pneumonia)"
        severity = "warning"
        advice = "Symptomatic with early pneumonia or high persistent fever."
        action = "Visit a COVID-19 Assessment Centre (CAC) or hospital clinic for clinical evaluation and chest X-ray within 24 hours."
    elif len(symptoms) > 0 or (37.5 <= temperature <= 38.5):
        category = "Category 2: Mild Symptoms"
        severity = "safe"
        advice = "Symptomatic without pneumonia (mild fever, cough, runny nose, or fatigue)."
        action = "Isolate at home (Home Quarantine for 5 days). Monitor temperature and SpO2 twice daily. Take paracetamol for fever and stay hydrated."
    else:
        category = "Category 1: Asymptomatic"
        severity = "safe"
        advice = "No symptoms detected, normal body temperature."
        action = "Practice standard self-hygiene and routine daily monitoring. No quarantine required unless exposed."

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO symptom_logs (user_id, temperature, symptoms)
        VALUES (?, ?, ?)
    ''', (user_id, temperature, str(symptoms)))
    conn.commit()
    conn.close()
    
    return jsonify({
        "message": "Symptoms recorded successfully",
        "category": category,
        "severity": severity,
        "advice": advice,
        "action": action
    }), 200

@app.route('/api/symptoms/history/<int:user_id>', methods=['GET'])
def get_symptom_history(user_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT temperature, symptoms, submitted_at 
        FROM symptom_logs 
        WHERE user_id = ? 
        ORDER BY submitted_at DESC
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            "temperature": row[0],
            "symptoms": row[1],
            "submitted_at": row[2]
        })
    return jsonify(history), 200

@app.route('/api/clinics', methods=['GET'])
def get_clinics():
    return jsonify(CLINICS_DIRECTORY), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)