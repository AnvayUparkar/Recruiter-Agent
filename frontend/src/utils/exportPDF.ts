import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Robustly exports a DOM element to a multi-page PDF.
 * Implements safeguards for rendering, animations, fonts, and images.
 */
export const exportToPDF = async (elementId: string, filename: string = 'export.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    // 1. Wait for Complete Rendering
    await document.fonts.ready;
    
    // Wait for all images in the document to load
    await Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve; // Continue even if an image fails
            })
        )
    );

    // Give React and charting libraries a final frame and buffer to finish painting
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 2. Prevent Clipping & Freeze Animations
    // Handled by .pdf-export CSS class overrides now instead of recursive DOM JS traversal

    // Add a temporary class to body to enforce global PDF export rules if needed
    document.body.classList.add('pdf-exporting');
    
    // Apply export styles BEFORE measuring DOM so our calculations match exactly what html2canvas will render!
    element.classList.add('pdf-export');

    // Give browser time to reflow layout with new CSS rules
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));

    // -- PAGE BREAK PREVENTION LOGIC --
    // html2canvas slices exactly by A4 ratio. We must push rows down if they cross the cut line.
    const A4_RATIO = 210 / 297; // Landscape ratio
    const containerWidth = element.offsetWidth;
    const pageHeightInDOM = containerWidth * A4_RATIO;
    const avoidElements = Array.from(element.querySelectorAll('.candidate-card, .section-container, .pdf-break-avoid')) as HTMLElement[];
    const originalMargins = new Map<HTMLElement, string>();

    if (avoidElements.length > 0) {
      const containerRectPre = element.getBoundingClientRect();
      
      const currentData = avoidElements.map(el => {
        const r = el.getBoundingClientRect();
        return {
          el,
          topRel: r.top - containerRectPre.top,
          bottomRel: r.bottom - containerRectPre.top,
          height: r.height
        };
      });

      // Group elements into rows if they are horizontally aligned (e.g. grid items)
      const rows: typeof currentData[] = [];
      currentData.forEach(data => {
        const foundRow = rows.find(row => Math.abs(row[0].topRel - data.topRel) < 10);
        if (foundRow) foundRow.push(data);
        else rows.push([data]);
      });

      rows.sort((a, b) => a[0].topRel - b[0].topRel);

      let accumulatedOffset = 0;
      rows.forEach(row => {
        const rowTop = row[0].topRel + accumulatedOffset;
        const maxBottomRel = Math.max(...row.map(d => d.bottomRel)) + accumulatedOffset;
        const maxHeight = Math.max(...row.map(d => d.height));
        
        const startPage = Math.floor((rowTop + 10) / pageHeightInDOM);
        const endPage = Math.floor((maxBottomRel - 10) / pageHeightInDOM);
        
        // If row crosses page break and isn't taller than a whole page
        if (startPage !== endPage && maxHeight < pageHeightInDOM) {
          const pageBreakPos = endPage * pageHeightInDOM;
          const pushAmount = pageBreakPos - rowTop + 40; // 40px top padding on new page
          
          row.forEach(data => {
            originalMargins.set(data.el, data.el.style.marginTop);
            const currentMargin = window.getComputedStyle(data.el).marginTop;
            data.el.style.setProperty('margin-top', `calc(${currentMargin} + ${pushAmount}px)`, 'important');
          });
          
          accumulatedOffset += pushAmount;
        }
      });
    }

    // Need another tick to ensure DOM applied any pending styles from margin adjustments
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 3. Capture using High Resolution
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    element.classList.remove('pdf-export');
    document.body.classList.remove('pdf-exporting');

    // Cleanup margins
    originalMargins.forEach((style, node) => {
      if (style) node.style.marginTop = style;
      else node.style.removeProperty('margin-top');
    });

    // 4. Multi-page PDF generation
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    // A4 dimensions in mm
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate the height of the image on the PDF scaled to width
    const imgHeightInPdf = (canvasHeight * pdfWidth) / canvasWidth;
    let heightLeft = imgHeightInPdf;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
    heightLeft -= pdfHeight;

    // Add subsequent pages if content exceeds one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeightInPdf;
      pdf.addPage();
      // We shift the image up by 'position' to draw the next segment
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('An error occurred while generating the PDF.');
  }
};
