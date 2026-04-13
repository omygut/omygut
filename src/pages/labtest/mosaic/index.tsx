import { View, Text, Canvas } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useRef, useEffect } from "react";
import "./index.css";

interface Point {
  x: number;
  y: number;
}

const TIPS: Record<string, string> = {
  labtest:
    '您上传的图片将用于 AI 自动识别化验指标。请用手指涂抹遮盖姓名、身份证号、住址、电话等敏感信息，确认图片中不含敏感个人信息后再点击"确认"。',
  exam: '您上传的图片将用于 AI 自动识别检查结论。请用手指涂抹遮盖姓名、身份证号、住址、电话等敏感信息，确认图片中不含敏感个人信息后再点击"确认"。',
};

// 马赛克笔刷大小
const BRUSH_SIZE = 30;
// 马赛克块大小
const BLOCK_SIZE = 10;

export default function MosaicEditor() {
  const router = useRouter();
  const imageUrl = decodeURIComponent(router.params.url || "");
  const source = router.params.source || "labtest";
  const tipText = TIPS[source] || TIPS.labtest;

  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [drawing, setDrawing] = useState(false);
  const [processing, setProcessing] = useState(false);
  // 记录所有涂抹过的点，用于撤销
  const [strokeHistory, setStrokeHistory] = useState<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const lastPointRef = useRef<Point | null>(null);

  const canvasRef = useRef<string>("mosaicCanvas");

  useEffect(() => {
    if (imageUrl) {
      loadImage();
    }
  }, [imageUrl]);

  const loadImage = async () => {
    try {
      // 获取图片信息
      const info = await Taro.getImageInfo({ src: imageUrl });
      setImageInfo({ width: info.width, height: info.height });

      // 计算 canvas 尺寸（适应屏幕宽度）
      const systemInfo = Taro.getSystemInfoSync();
      const maxWidth = systemInfo.windowWidth - 32;
      const maxHeight = systemInfo.windowHeight - 200;

      let displayWidth = info.width;
      let displayHeight = info.height;
      if (displayWidth > maxWidth) {
        const ratio = maxWidth / displayWidth;
        displayWidth = maxWidth;
        displayHeight = info.height * ratio;
      }

      if (displayHeight > maxHeight) {
        const ratio = maxHeight / displayHeight;
        displayWidth *= ratio;
        displayHeight *= ratio;
      }
      setCanvasSize({ width: displayWidth, height: displayHeight });

      // 绘制图片到 canvas
      setTimeout(() => {
        drawCanvas(displayWidth, displayHeight);
      }, 100);
    } catch (error) {
      console.error("加载图片失败:", error);
      Taro.showToast({ title: "加载图片失败", icon: "none" });
    }
  };

  const drawCanvas = (width: number, height: number) => {
    const ctx = Taro.createCanvasContext(canvasRef.current);
    ctx.drawImage(imageUrl, 0, 0, width, height);
    ctx.draw();
  };

  const vibrateLight = () => {
    try {
      Taro.vibrateShort({ type: "light" });
    } catch {
      // 忽略振动失败
    }
  };

  // 在某个点绘制马赛克
  const drawMosaicAt = (ctx: Taro.CanvasContext, point: Point) => {
    const halfBrush = BRUSH_SIZE / 2;
    const startX = Math.floor((point.x - halfBrush) / BLOCK_SIZE) * BLOCK_SIZE;
    const startY = Math.floor((point.y - halfBrush) / BLOCK_SIZE) * BLOCK_SIZE;
    const endX = point.x + halfBrush;
    const endY = point.y + halfBrush;

    for (let x = startX; x < endX; x += BLOCK_SIZE) {
      for (let y = startY; y < endY; y += BLOCK_SIZE) {
        const gray = Math.floor(Math.random() * 100) + 100;
        ctx.setFillStyle(`rgb(${gray}, ${gray}, ${gray})`);
        ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  };

  // 在两点之间插值绘制马赛克（让线条连续）
  const drawMosaicLine = (ctx: Taro.CanvasContext, from: Point, to: Point) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(distance / (BLOCK_SIZE / 2)));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = {
        x: from.x + dx * t,
        y: from.y + dy * t,
      };
      drawMosaicAt(ctx, point);
    }
  };

  const handleTouchStart = (e: { touches: { x: number; y: number }[] }) => {
    const touch = e.touches[0];
    const point = { x: touch.x, y: touch.y };

    vibrateLight();
    setDrawing(true);
    currentStrokeRef.current = [point];
    lastPointRef.current = point;

    // 立即绘制当前点
    const ctx = Taro.createCanvasContext(canvasRef.current);
    ctx.drawImage(imageUrl, 0, 0, canvasSize.width, canvasSize.height);

    // 绘制历史笔画
    strokeHistory.forEach((stroke) => {
      for (let i = 0; i < stroke.length; i++) {
        if (i === 0) {
          drawMosaicAt(ctx, stroke[i]);
        } else {
          drawMosaicLine(ctx, stroke[i - 1], stroke[i]);
        }
      }
    });

    // 绘制当前点
    drawMosaicAt(ctx, point);
    ctx.draw();
  };

  const handleTouchMove = (e: { touches: { x: number; y: number }[] }) => {
    if (!drawing) return;

    const touch = e.touches[0];
    const point = { x: touch.x, y: touch.y };
    currentStrokeRef.current.push(point);

    const ctx = Taro.createCanvasContext(canvasRef.current);
    ctx.drawImage(imageUrl, 0, 0, canvasSize.width, canvasSize.height);

    // 绘制历史笔画
    strokeHistory.forEach((stroke) => {
      for (let i = 0; i < stroke.length; i++) {
        if (i === 0) {
          drawMosaicAt(ctx, stroke[i]);
        } else {
          drawMosaicLine(ctx, stroke[i - 1], stroke[i]);
        }
      }
    });

    // 绘制当前笔画
    const currentStroke = currentStrokeRef.current;
    for (let i = 0; i < currentStroke.length; i++) {
      if (i === 0) {
        drawMosaicAt(ctx, currentStroke[i]);
      } else {
        drawMosaicLine(ctx, currentStroke[i - 1], currentStroke[i]);
      }
    }

    ctx.draw();
    lastPointRef.current = point;
  };

  const handleTouchEnd = () => {
    if (!drawing) return;

    setDrawing(false);

    // 保存当前笔画到历史
    if (currentStrokeRef.current.length > 0) {
      setStrokeHistory([...strokeHistory, [...currentStrokeRef.current]]);
    }

    currentStrokeRef.current = [];
    lastPointRef.current = null;
  };

  const redrawAllStrokes = (strokes: Point[][]) => {
    const ctx = Taro.createCanvasContext(canvasRef.current);
    ctx.drawImage(imageUrl, 0, 0, canvasSize.width, canvasSize.height);

    strokes.forEach((stroke) => {
      for (let i = 0; i < stroke.length; i++) {
        if (i === 0) {
          drawMosaicAt(ctx, stroke[i]);
        } else {
          drawMosaicLine(ctx, stroke[i - 1], stroke[i]);
        }
      }
    });

    ctx.draw();
  };

  const handleUndo = () => {
    if (strokeHistory.length === 0) return;
    vibrateLight();

    const newHistory = strokeHistory.slice(0, -1);
    setStrokeHistory(newHistory);
    redrawAllStrokes(newHistory);
  };

  const handleClearAll = () => {
    if (strokeHistory.length === 0) return;
    vibrateLight();

    setStrokeHistory([]);
    // 重绘原图
    const ctx = Taro.createCanvasContext(canvasRef.current);
    ctx.drawImage(imageUrl, 0, 0, canvasSize.width, canvasSize.height);
    ctx.draw();
  };

  const handleSave = async () => {
    if (processing) return;

    setProcessing(true);
    try {
      // 计算导出尺寸，限制最大 1920px
      const MAX_SIZE = 1920;
      let destWidth = imageInfo?.width || canvasSize.width;
      let destHeight = imageInfo?.height || canvasSize.height;

      if (destWidth > MAX_SIZE || destHeight > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / destWidth, MAX_SIZE / destHeight);
        destWidth = Math.round(destWidth * ratio);
        destHeight = Math.round(destHeight * ratio);
      }

      // 导出 canvas 为图片
      const res = await Taro.canvasToTempFilePath({
        canvasId: canvasRef.current,
        width: canvasSize.width,
        height: canvasSize.height,
        destWidth,
        destHeight,
        fileType: "jpg",
        quality: 0.8,
      });

      // 返回处理后的图片路径
      const pages = Taro.getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        prevPage.setData?.({ mosaicResult: res.tempFilePath });
      }

      // 使用 eventCenter 传递结果
      Taro.eventCenter.trigger("mosaicComplete", {
        resultPath: res.tempFilePath,
      });

      Taro.navigateBack();
    } catch (error) {
      console.error("保存失败:", error);
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setProcessing(false);
    }
  };

  if (!imageUrl) {
    return (
      <View className="mosaic-page">
        <Text className="error-text">未提供图片</Text>
      </View>
    );
  }

  return (
    <View className="mosaic-page">
      <View className="tips">
        <Text className="tips-text">{tipText}</Text>
      </View>

      <View className="canvas-container">
        <View
          className="canvas-wrapper"
          style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
        >
          {canvasSize.width > 0 && (
            <Canvas
              canvasId={canvasRef.current}
              style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          )}
          {/* 涂抹提示 - 无涂抹时显示 */}
          {strokeHistory.length === 0 && !drawing && (
            <View className="select-hint">
              <Text className="select-hint-text">用手指涂抹敏感信息</Text>
            </View>
          )}
        </View>
      </View>

      <View className="action-bar">
        <View
          className={`action-btn secondary-btn ${strokeHistory.length === 0 ? "disabled" : ""}`}
          onClick={handleClearAll}
        >
          清除
        </View>
        <View
          className={`action-btn secondary-btn ${strokeHistory.length === 0 ? "disabled" : ""}`}
          onClick={handleUndo}
        >
          撤销
        </View>
        <View
          className={`action-btn save-btn ${processing ? "disabled" : ""}`}
          onClick={handleSave}
        >
          {processing ? "处理中..." : "确认"}
        </View>
      </View>
    </View>
  );
}
