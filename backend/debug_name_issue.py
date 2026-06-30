"""Debug why name extraction fails with longer text."""

from services.resume_parser import ResumeParser

def debug_name_extraction():
    """Debug the name extraction step by step."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("DEBUGGING NAME EXTRACTION")
    print("=" * 80)
    
    # Shorter text that works
    short_text = """
Name                                                                                                            Achievements

Anvay_Uparkar

Bachelor of Technology, Artificial Intelligence & Data Science [4th Year]
Shah & Anchor Kutchhi Engineering College, Chembur
"""
    
    # Longer text from the complete resume
    long_text = """
Name                                                                                                            Achievements

Anvay_Uparkar                                                                                                   +91-9702017203
                                                                                                               anvayuparkar@gmail.com
Bachelor of Technology, Artificial Intelligence & Data Science [4th Year]
Shah & Anchor Kutchhi Engineering College, Chembur

Achievements

•Runner Up at GITAM Deemed to be University IASF Project Showcase-Bangalore                                     April-2026
"""
    
    print("TEST 1: Short text (known to work)")
    result1 = parser._extract_name(short_text)
    print(f"Result: '{result1}'")
    
    print(f"\nTEST 2: Long text (failing)")
    result2 = parser._extract_name(long_text)
    print(f"Result: '{result2}'")
    
    print(f"\nLINE-BY-LINE ANALYSIS (Long text, first 10 lines):")
    lines = [line.strip() for line in long_text.split('\n') if line.strip()]
    
    for i, line in enumerate(lines[:10]):
        print(f"  Line {i+1}: '{line}'")
        
        # Check if this line would be skipped
        line_lower = line.lower().strip()
        
        # Check skip conditions
        skip_reasons = []
        
        # Skip keywords
        skip_keywords = {
            "contact", "contact info", "contact information", "resume", 
            "curriculum vitae", "cv", "profile", "personal information",
            "personal details", "objective", "summary", "name achievements",
            "achievements", "experience", "education", "skills", "projects"
        }
        if line_lower in skip_keywords:
            skip_reasons.append("skip_keywords")
        
        # Skip patterns
        skip_patterns = [
            r'name\s+achievements',
            r'achievements\s+name',
            r'name\s+.*\s+achievements',
            r'contact\s+.*\s+info',
        ]
        import re
        if any(re.match(pattern, line_lower) for pattern in skip_patterns):
            skip_reasons.append("skip_patterns")
            
        # Check for email/digits
        if '@' in line or any(c.isdigit() for c in line) and len([c for c in line if c.isdigit()]) > 3:
            skip_reasons.append("email_or_digits")
            
        # Check length
        if len(line) > 60:
            skip_reasons.append("too_long")
            
        # Check all caps
        if line.isupper() and len(line) > 25:
            skip_reasons.append("all_caps")
            
        # Check bullets
        if line.startswith(('•', '●', '■', '-', '*', '►')):
            skip_reasons.append("bullet_point")
        
        if skip_reasons:
            print(f"    -> SKIPPED: {', '.join(skip_reasons)}")
        else:
            # Would this be processed?
            cleaned = line.strip().replace('_', ' ')
            cleaned = ' '.join(cleaned.split())
            words = cleaned.split()
            
            if 1 <= len(words) <= 5:
                alpha_ratio = sum(c.isalpha() or c.isspace() for c in cleaned) / max(len(cleaned), 1)
                if alpha_ratio > 0.6 and len(cleaned) >= 3:
                    print(f"    -> CANDIDATE: '{cleaned}' (alpha_ratio: {alpha_ratio:.2f})")
                else:
                    print(f"    -> REJECTED: alpha_ratio {alpha_ratio:.2f} or too short")
            else:
                print(f"    -> REJECTED: {len(words)} words (need 1-5)")

if __name__ == "__main__":
    debug_name_extraction()