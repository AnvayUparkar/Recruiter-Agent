"""Test complete contact extraction including name, email, phone from the screenshot format."""

from services.resume_parser import ResumeParser

def test_complete_contact_extraction():
    """Test complete contact extraction with the exact screenshot format."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("COMPLETE CONTACT EXTRACTION TEST")
    print("=" * 80)
    
    # Recreate the exact format from your screenshot
    test_text = """
Name                                                                                                            Achievements

Anvay_Uparkar                                                                                                   +91-9702017203
                                                                                                               anvayuparkar@gmail.com
Bachelor of Technology, Artificial Intelligence & Data Science [4th Year]
Shah & Anchor Kutchhi Engineering College, Chembur

Achievements

•Runner Up at GITAM Deemed to be University IASF Project Showcase-Bangalore                                     April-2026
  Recognized among SAKEC's best projects [JARVIS] and presented at GITAM University IASF, where it was awarded
  Runner-Up and received a ₹5,000 cash prize.

• Consolation Prize at CDAC Brainathon                                                                        December-2024
  Awarded a consolation prize and ₹2,000 in the Brainathon competition for designing and implementing a time series analysis machine
  learning model using IBM Watson Studio.

Education

PROJECTS

AI-Driven Diagnostics For Health Innovation [Mini-Project] - (Completed) - [Sem-VI]
https://neuro-care-ai.netlify.app/

AI-powered platform for real-time disease prediction (lung cancer, diabetes, heart) using Machine Learning, combined with a smart diet
planner and explainable insights for proactive healthcare decisions. Integrates Generative AI clinical guidance and decision support.OCR-
based report analysis for extracting biomarkers (HbA1c, lipid profile)

Activity-based diet recommendations using Google Fit / Health Connect and Gesture-based SOS emergency system with live routing and
alerts using OpenCV
Uses Nominatim + Leaflet with OpenStreetMap for location tracking & hospital navigation

Technologies: Artificial Intelligence, Generative AI

EXPERIENCE

•Product Development Team-
– Developed a Student-Faculty Ratio Application under the guidance of the HOD to support faculty requirement analysis based on
student intake.
Link - https://st-ds-product-dev.vercel.app/login
– Currently developing an application to track student participation in NGO events for Agastya, Akshaya Shakti Foundation, and
participating colleges.

EDUCATION

Bachelor of Technology - Artificial Intelligence & Data Science [4th Year]
Shah & Anchor Kutchhi Engineering College, Chembur
University of Mumbai
2021 - 2025
"""
    
    print("PARSING COMPLETE RESUME...")
    parsed = parser._extract_structured_data(test_text)
    
    print(f"\nCONTACT INFORMATION EXTRACTED:")
    print("=" * 40)
    print(f"Name: '{parsed.name}'")
    print(f"Email: '{parsed.email}'")
    print(f"Phone: '{parsed.phone}'")
    print(f"LinkedIn: '{parsed.linkedin}'")
    print(f"GitHub: '{parsed.github}'")
    
    print(f"\nOTHER EXTRACTED DATA:")
    print("=" * 40)
    print(f"Projects: {len(parsed.projects)}")
    print(f"Experience: {len(parsed.experience)}")
    print(f"Education: {len(parsed.education)}")
    print(f"Achievements: {len(parsed.achievements)}")
    print(f"Skills: {len(parsed.skills)}")
    print(f"Years of Experience: {parsed.years_of_experience}")
    
    print(f"\nVERIFICATION:")
    print("=" * 40)
    
    # Expected values
    expected_name = "Anvay Uparkar"
    expected_email = "anvayuparkar@gmail.com"
    expected_phone = "+91-9702017203"
    
    # Check name
    name_correct = parsed.name == expected_name
    print(f"{'✓' if name_correct else '✗'} Name: Expected '{expected_name}', Got '{parsed.name}'")
    
    # Check email
    email_correct = parsed.email == expected_email
    print(f"{'✓' if email_correct else '✗'} Email: Expected '{expected_email}', Got '{parsed.email}'")
    
    # Check phone
    phone_correct = expected_phone in parsed.phone or parsed.phone in expected_phone
    print(f"{'✓' if phone_correct else '✗'} Phone: Expected '{expected_phone}', Got '{parsed.phone}'")
    
    # Check projects
    projects_correct = len(parsed.projects) >= 3  # Should extract at least 3 projects
    print(f"{'✓' if projects_correct else '✗'} Projects: Expected ≥3, Got {len(parsed.projects)}")
    
    # Check experience
    experience_correct = len(parsed.experience) >= 1  # Should extract Product Development Team
    print(f"{'✓' if experience_correct else '✗'} Experience: Expected ≥1, Got {len(parsed.experience)}")
    
    # Overall success
    overall_success = name_correct and email_correct and phone_correct and projects_correct and experience_correct
    
    print(f"\nOVERALL RESULT: {'🎉 SUCCESS - All contact info extracted correctly!' if overall_success else '❌ Some issues detected'}")
    
    if not overall_success:
        print("\n📋 DETAILED PROJECT LIST:")
        for i, proj in enumerate(parsed.projects, 1):
            print(f"  {i}. {proj.get('title', 'N/A')}")
        
        print(f"\n📋 DETAILED EXPERIENCE LIST:")
        for i, exp in enumerate(parsed.experience, 1):
            print(f"  {i}. {exp.get('company', 'N/A')} - {exp.get('designation', 'N/A')}")
    
    return overall_success

if __name__ == "__main__":
    print("Testing Complete Contact Extraction from Screenshot Format\n")
    test_complete_contact_extraction()