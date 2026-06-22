import io
import pytest
import zipfile
import xml.etree.ElementTree as ET
from services.jd_text_extractor import JdTextExtractor

def test_extract_text_from_txt():
    stream = io.BytesIO(b"Hello World from TXT!")
    text = JdTextExtractor.extract_text("test.txt", stream)
    assert text == "Hello World from TXT!"

def test_extract_text_from_docx_mocked():
    # Construct a valid minimal mock docx zip file
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, 'w') as docx:
        # Create standard word/document.xml
        xml_content = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:body>
                <w:p>
                    <w:r>
                        <w:t>Hello World from DOCX!</w:t>
                    </w:r>
                </w:p>
            </w:body>
        </w:document>
        """
        docx.writestr('word/document.xml', xml_content)
    
    stream.seek(0)
    text = JdTextExtractor.extract_text("test.docx", stream)
    assert text == "Hello World from DOCX!"
