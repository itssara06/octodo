"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Save, ChevronLeft, PenTool, MousePointer2, ZoomIn, ZoomOut, Eraser, Square, Circle, Type, Minus, Hand } from "lucide-react";
import { updateAnnotations } from "@/app/actions/documents";
import Link from "next/link";
import { fabric } from "fabric";

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type ToolMode = 'draw' | 'select' | 'pan' | 'eraser' | 'rect' | 'circle' | 'text' | 'line';
const COLORS = [
  { name: 'Black', value: '#1e1e1e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#f59e0b' },
];
const STROKE_WIDTHS = [
  { name: 'Small', value: 2 },
  { name: 'Medium', value: 4 },
  { name: 'Large', value: 8 },
];

export function PDFAnnotator({ document }: { document: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfPages, setPdfPages] = useState<{ dataUrl: string, width: number, height: number, pageNum: number }[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<ToolMode>('draw');
  const [color, setColor] = useState(COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].value);
  
  // Ref states for event handlers to access current values
  const modeRef = useRef(mode);
  const colorRef = useRef(color);
  const strokeWidthRef = useRef(strokeWidth);
  const isDrawingShape = useRef(false);
  const currentShape = useRef<fabric.Object | null>(null);
  const startPos = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    colorRef.current = color;
    strokeWidthRef.current = strokeWidth;

    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.isDrawingMode = mode === 'draw';
      if (mode === 'draw') {
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = strokeWidth;
      }

      // Apply to selected objects
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length > 0) {
        let changed = false;
        activeObjects.forEach(obj => {
          if (obj.type === 'i-text' || obj.type === 'text') {
            obj.set('fill', color);
            changed = true;
          } else if (obj.type === 'path' || obj.type === 'line' || obj.type === 'rect' || obj.type === 'circle') {
            obj.set('stroke', color);
            obj.set('strokeWidth', strokeWidth);
            if (obj.type !== 'path' && obj.type !== 'line') {
              // Shapes are transparent fill by default
              obj.set('fill', 'transparent');
            }
            changed = true;
          }
        });
        if (changed) {
          canvas.requestRenderAll();
          canvas.fire('object:modified');
        }
      }
    }
  }, [mode, color, strokeWidth]);

  useEffect(() => {
    async function loadPDF() {
      try {
        const loadingTask = pdfjsLib.getDocument({ url: document.fileUrl });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const pages = [];
        
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); 
          
          const canvas = window.document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({ canvasContext: ctx!, viewport }).promise;
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          
          pages.push({ dataUrl, width: viewport.width, height: viewport.height, pageNum: i });
        }
        
        setPdfPages(pages);
      } catch (err) {
        console.error("Error loading PDF", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (document.fileUrl) {
      loadPDF();
    }
  }, [document.fileUrl]);

  useEffect(() => {
    if (pdfPages.length === 0 || !canvasRef.current || !wrapperRef.current) return;

    // Initialize Fabric Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: modeRef.current === 'draw',
      width: wrapperRef.current.clientWidth,
      height: wrapperRef.current.clientHeight,
      backgroundColor: '#f1f5f9', // slate-100
      selection: true,
    });
    fabricCanvasRef.current = canvas;

    // Set up drawing brush
    canvas.freeDrawingBrush.color = colorRef.current;
    canvas.freeDrawingBrush.width = strokeWidthRef.current;

    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          // Don't delete if we are currently editing text
          if (activeObjects.length === 1 && activeObjects[0].isEditing) return;
          
          activeObjects.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          canvas.fire('object:modified');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Zooming logic
    canvas.on('mouse:wheel', function(opt) {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 5) zoom = 5;
      if (zoom < 0.1) zoom = 0.1;
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Handle mouse down (Start shape, pan, or erase)
    canvas.on('mouse:down', function(opt) {
      const evt = opt.e as MouseEvent;
      const currentMode = modeRef.current;

      // Panning
      if (evt.altKey || evt.button === 1 || currentMode === 'pan') {
        isPanning = true;
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        return;
      }

      // Erasing
      if (currentMode === 'eraser') {
        if (opt.target && !opt.target.id?.startsWith('pdf_page_')) {
          canvas.remove(opt.target);
          canvas.requestRenderAll();
          canvas.fire('object:modified');
        }
        return;
      }

      // Object Selection overrides shape creation if clicking on an object in select mode
      if (currentMode === 'select') return;

      // Disable selection for shape creation modes
      if (['rect', 'circle', 'line', 'text'].includes(currentMode)) {
        canvas.selection = false;
      }

      // Shape Creation
      const pointer = canvas.getPointer(opt.e);
      if (currentMode === 'text') {
        const text = new fabric.IText('Text', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'sans-serif',
          fill: colorRef.current,
          fontSize: 24,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        setMode('select'); // Switch to select mode automatically
        canvas.fire('object:modified');
        return;
      }

      if (['rect', 'circle', 'line'].includes(currentMode)) {
        isDrawingShape.current = true;
        startPos.current = { x: pointer.x, y: pointer.y };

        const commonProps = {
          stroke: colorRef.current,
          strokeWidth: strokeWidthRef.current,
          fill: 'transparent',
          selectable: true,
        };

        if (currentMode === 'rect') {
          currentShape.current = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            ...commonProps
          });
        } else if (currentMode === 'circle') {
          currentShape.current = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            ...commonProps
          });
        } else if (currentMode === 'line') {
          currentShape.current = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            ...commonProps
          });
        }
        
        if (currentShape.current) {
          canvas.add(currentShape.current);
        }
      }
    });

    // Handle mouse move
    canvas.on('mouse:move', function(opt) {
      const evt = opt.e as MouseEvent;
      const currentMode = modeRef.current;

      if (isPanning) {
        const vpt = this.viewportTransform;
        if (vpt) {
          vpt[4] += evt.clientX - lastPosX;
          vpt[5] += evt.clientY - lastPosY;
          this.requestRenderAll();
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
        return;
      }

      if (isDrawingShape.current && currentShape.current && startPos.current) {
        const pointer = canvas.getPointer(opt.e);
        
        if (currentMode === 'rect') {
          const rect = currentShape.current as fabric.Rect;
          rect.set({
            width: Math.abs(pointer.x - startPos.current.x),
            height: Math.abs(pointer.y - startPos.current.y),
          });
          if (pointer.x < startPos.current.x) rect.set({ left: pointer.x });
          if (pointer.y < startPos.current.y) rect.set({ top: pointer.y });
        } else if (currentMode === 'circle') {
          const circle = currentShape.current as fabric.Circle;
          const radius = Math.abs(pointer.x - startPos.current.x) / 2;
          circle.set({ radius });
          if (pointer.x < startPos.current.x) circle.set({ left: pointer.x });
          if (pointer.y < startPos.current.y) circle.set({ top: pointer.y });
        } else if (currentMode === 'line') {
          const line = currentShape.current as fabric.Line;
          line.set({ x2: pointer.x, y2: pointer.y });
        }
        
        canvas.requestRenderAll();
      }
    });

    // Handle mouse up
    canvas.on('mouse:up', function() {
      isPanning = false;
      canvas.selection = true;
      // update coordinates of all objects after pan
      canvas.setViewportTransform(canvas.viewportTransform as number[]);

      if (isDrawingShape.current) {
        isDrawingShape.current = false;
        if (currentShape.current) {
          currentShape.current.setCoords();
          canvas.fire('object:modified');
        }
        currentShape.current = null;
        startPos.current = null;
        // Keep user in shape drawing mode (Tldraw-style keeps it until esc or tool change)
      }
    });

    // Eraser drag behavior
    canvas.on('mouse:over', function(opt) {
      if (modeRef.current === 'eraser' && opt.e.buttons === 1) { // Left mouse button down
        if (opt.target && !opt.target.id?.startsWith('pdf_page_')) {
          canvas.remove(opt.target);
          canvas.requestRenderAll();
          canvas.fire('object:modified');
        }
      }
    });

    // Handle Window Resize
    const handleResize = () => {
      if (wrapperRef.current) {
        canvas.setWidth(wrapperRef.current.clientWidth);
        canvas.setHeight(wrapperRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Initialize or restore
    if (document.annotationsData && document.annotationsData.trim().length > 0) {
      try {
        const snapshot = JSON.parse(document.annotationsData);
        canvas.loadFromJSON(snapshot, () => {
          // Re-inject the base64 images into the assets so they display
          const objects = canvas.getObjects();
          let pageIndex = 0;
          objects.forEach((obj) => {
            if (obj.type === 'image' && (obj as any).id?.startsWith('pdf_page_')) {
              const page = pdfPages[pageIndex];
              if (page) {
                (obj as fabric.Image).setSrc(page.dataUrl, () => {
                  canvas.renderAll();
                });
                pageIndex++;
              }
            }
          });
        });
      } catch (e) {
        console.error("Failed to load annotations snapshot", e);
      }
    } else {
      // First time loading: Insert PDF pages as images
      let currentY = 50;
      const GAP = 50;
      let maxWidth = 0;
      
      pdfPages.forEach((page, index) => {
        fabric.Image.fromURL(page.dataUrl, (img) => {
          img.set({
            left: 50,
            top: currentY,
            selectable: false,
            evented: false,
            id: `pdf_page_${page.pageNum}`, // custom property
          } as any);
          
          canvas.insertAt(img, index, false);
          
          currentY += page.height + GAP;
          if (page.width > maxWidth) maxWidth = page.width;
          
          if (index === pdfPages.length - 1) {
            // Zoom to fit the first page roughly
            const scale = (wrapperRef.current!.clientWidth - 100) / maxWidth;
            if (scale < 1) canvas.setZoom(scale);
            canvas.renderAll();
          }
        });
      });
    }

    // Auto-save logic
    let timeoutId: NodeJS.Timeout;
    const saveToDb = async () => {
      try {
        const json = canvas.toJSON(['id']); // include custom 'id' property
        // Strip out the massive base64 strings from the snapshot to save DB space
        json.objects.forEach((obj: any) => {
          if (obj.type === 'image' && obj.id?.startsWith('pdf_page_')) {
            obj.src = ""; // Clear base64
          }
        });
        await updateAnnotations(document.id, JSON.stringify(json));
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    };

    canvas.on('object:modified', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveToDb, 2000);
    });
    
    canvas.on('path:created', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveToDb, 2000);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
      clearTimeout(timeoutId);
    };
  }, [pdfPages, document.annotationsData, document.id]);

  const handleSave = async () => {
    if (!fabricCanvasRef.current) return;
    setSaving(true);
    try {
      const json = fabricCanvasRef.current.toJSON(['id']);
      json.objects.forEach((obj: any) => {
        if (obj.type === 'image' && obj.id?.startsWith('pdf_page_')) {
          obj.src = ""; 
        }
      });
      await updateAnnotations(document.id, JSON.stringify(json));
    } catch (e) {
      console.error(e);
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!fabricCanvasRef.current) return;
    setDownloading(true);
    try {
      // 1. Fetch original PDF
      const pdfRes = await fetch(document.fileUrl);
      const pdfBytes = await pdfRes.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pdfLibPages = pdfDoc.getPages();
      
      const canvas = fabricCanvasRef.current;
      
      // Save original viewport transform to restore later
      const originalVpt = [...(canvas.viewportTransform || [1,0,0,1,0,0])];
      
      // Reset viewport to 1:1 scale at 0,0 so we can accurately render bounding boxes
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      // 2. For each page, export the annotations as a transparent PNG
      const objects = canvas.getObjects();
      
      for (let i = 0; i < pdfPages.length; i++) {
        const page = pdfPages[i];
        const pageObj = objects.find(o => (o as any).id === `pdf_page_${page.pageNum}`);
        
        if (!pageObj) continue;

        // Hide the background page shape so it doesn't appear in the exported PNG
        const originalOpacity = pageObj.opacity;
        pageObj.set('opacity', 0);

        // Export a cropped data URL of just the page's bounding box
        const dataUrl = canvas.toDataURL({
          format: 'png',
          left: pageObj.left || 0,
          top: pageObj.top || 0,
          width: page.width,
          height: page.height,
          multiplier: 1 // 1x scale because page.width/height are already high-res (scale 2.0 from pdfjs)
        });

        // Restore page opacity
        pageObj.set('opacity', originalOpacity);

        // 3. Draw the PNG onto the original PDF page using pdf-lib
        const pngImage = await pdfDoc.embedPng(dataUrl);
        const pdfPage = pdfLibPages[i];
        const { width, height } = pdfPage.getSize();
        
        pdfPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }
      
      // Restore viewport
      canvas.setViewportTransform(originalVpt);

      // 4. Save and trigger download
      const mergedPdfBytes = await pdfDoc.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `Annotated_${document.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Failed to download annotated PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Document Viewer...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative overflow-hidden bg-slate-100">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-md z-20 shadow-sm border-b relative">
        <div className="flex items-center gap-4">
          <Link href="/library">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">{document.name}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Download
          </Button>
        </div>
      </div>
      
      {/* Tldraw-Style Floating Properties Panel (Left) */}
      <div className="absolute left-6 top-24 z-20 flex flex-col gap-4">
        <div className="bg-background/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border flex flex-col gap-4 w-14 items-center">
          {/* Colors */}
          <div className="flex flex-col gap-2">
            {COLORS.map((c) => (
              <button
                key={c.name}
                title={c.name}
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.value ? 'border-primary scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          
          <div className="w-8 h-px bg-border" />
          
          {/* Stroke Widths */}
          <div className="flex flex-col gap-3 items-center w-full">
            {STROKE_WIDTHS.map((s) => (
              <button
                key={s.name}
                title={s.name}
                onClick={() => setStrokeWidth(s.value)}
                className={`flex items-center justify-center w-8 h-8 rounded-md transition-all ${strokeWidth === s.value ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <div 
                  className="bg-current rounded-full" 
                  style={{ width: s.value + 4, height: s.value + 4 }} 
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tldraw-Style Bottom Floating Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-background/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border flex items-center gap-1">
          <Button 
            variant={mode === 'select' ? "secondary" : "ghost"} 
            size="icon" 
            className="rounded-xl"
            onClick={() => setMode('select')} title="Select (V)"
          >
            <MousePointer2 className="h-5 w-5" />
          </Button>
          <Button 
            variant={mode === 'pan' ? "secondary" : "ghost"} 
            size="icon" 
            className="rounded-xl"
            onClick={() => setMode('pan')} title="Pan (H)"
          >
            <Hand className="h-5 w-5" />
          </Button>
          <div className="w-px h-8 bg-border mx-1" />
          <Button 
            variant={mode === 'draw' ? "secondary" : "ghost"} 
            size="icon" 
            className="rounded-xl"
            onClick={() => setMode('draw')} title="Draw (D)"
          >
            <PenTool className="h-5 w-5" />
          </Button>
          <Button 
            variant={mode === 'eraser' ? "secondary" : "ghost"} 
            size="icon" 
            className="rounded-xl text-destructive"
            onClick={() => setMode('eraser')} title="Eraser (E)"
          >
            <Eraser className="h-5 w-5" />
          </Button>
          <div className="w-px h-8 bg-border mx-1" />
          <Button 
            variant={mode === 'rect' ? "secondary" : "ghost"} 
            size="icon" 
            className="rounded-xl"
            onClick={() => setMode('rect')} title="Rectangle (R)"
          >
            <Square className="h-5 w-5" />
          </Button>
          <Button 
            variant={mode === 'circle' ? "secondary" : "ghost"} 
            size="icon" 
            className="rounded-xl"
            onClick={() => setMode('circle')} title="Ellipse (O)"
          >
            <Circle className="h-5 w-5" />
          </Button>
          <Button 
            variant={mode === 'line' ? "secondary" : "ghost"} 
            size="icon" 
            className="rounded-xl"
            onClick={() => setMode('line')} title="Line (L)"
          >
            <Minus className="h-5 w-5" />
          </Button>
          <Button 
            variant={mode === 'text' ? "secondary" : "ghost"} 
            size="icon" 
            className="rounded-xl"
            onClick={() => setMode('text')} title="Text (T)"
          >
            <Type className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Zoom controls (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
        <Button variant="secondary" size="icon" className="shadow-xl rounded-full h-10 w-10 border bg-background/90 backdrop-blur-md hover:bg-background" onClick={() => {
          if (fabricCanvasRef.current) {
            const zoom = fabricCanvasRef.current.getZoom();
            fabricCanvasRef.current.setZoom(zoom * 1.2);
          }
        }}>
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button variant="secondary" size="icon" className="shadow-xl rounded-full h-10 w-10 border bg-background/90 backdrop-blur-md hover:bg-background" onClick={() => {
           if (fabricCanvasRef.current) {
            const zoom = fabricCanvasRef.current.getZoom();
            fabricCanvasRef.current.setZoom(zoom / 1.2);
          }
        }}>
          <ZoomOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Canvas Wrapper */}
      <div className="flex-1 w-full bg-slate-100 overflow-hidden" ref={wrapperRef}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
