"""Job Description Document Text Extractor Service.

Parses text from TXT, PDF, and DOCX files.
"""

import zipfile
import xml.etree.ElementTree as ET
import io
from pypdf import PdfReader
from utils.logger import get_logger

logger = get_logger(__name__)


class JdTextExtractor:
    """Helper to extract raw text content from uploaded document streams."""

    @staticmethod
    def extract_text_from_docx(file_stream) -> str:
        """Parses text from a DOCX stream using native xml structure iteration.

        Args:
            file_stream: BytesIO or file stream.
        """
        try:
            with zipfile.ZipFile(file_stream) as docx:
                xml_content = docx.read('word/document.xml')
                root = ET.fromstring(xml_content)
                
                text_parts = []
                for elem in root.iter():
                    tag_name = elem.tag.split('}')[-1]
                    if tag_name == 'p':
                        p_text = []
                        for child in elem.iter():
                            child_tag = child.tag.split('}')[-1]
                            if child_tag == 't' and child.text:
                                p_text.append(child.text)
                        if p_text:
                            text_parts.append(''.join(p_text))
                return '\n'.join(text_parts)
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}", exc_info=True)
            raise ValueError(f"Failed to parse DOCX file: {e}")

    @staticmethod
    def extract_text_from_pdf(file_stream) -> str:
        """Parses text from a PDF stream using pypdf.

        Args:
            file_stream: BytesIO or file stream.
        """
        try:
            reader = PdfReader(file_stream)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return '\n\n'.join(text_parts)
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}", exc_info=True)
            raise ValueError(f"Failed to parse PDF file: {e}")

    @staticmethod
    def extract_text_from_txt(file_stream) -> str:
        """Parses text from a TXT stream using utf-8 or latin-1 decoders.

        Args:
            file_stream: BytesIO or file stream.
        """
        try:
            content = file_stream.read()
            if isinstance(content, bytes):
                try:
                    return content.decode('utf-8')
                except UnicodeDecodeError:
                    return content.decode('latin-1')
            return content
        except Exception as e:
            logger.error(f"Error extracting text from TXT: {e}", exc_info=True)
            raise ValueError(f"Failed to parse TXT file: {e}")

    @classmethod
    def extract_text(cls, filename: str, file_stream) -> str:
        """Main dispatcher function mapping file extensions to extractors."""
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        if ext == 'txt':
            return cls.extract_text_from_txt(file_stream)
        elif ext == 'pdf':
            return cls.extract_text_from_pdf(file_stream)
        elif ext in ('docx', 'doc'):
            # Note: We treat old doc file uploads with docx reader since it's the closest fallback
            return cls.extract_text_from_docx(file_stream)
        else:
            raise ValueError(f"Unsupported file extension: .{ext}")
