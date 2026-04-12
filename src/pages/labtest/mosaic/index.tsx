import { View, Text, Canvas } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useRef, useEffect } from "react";
import "./index.css";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function MosaicEditor() {
  const router = useRouter();
  const imageUrl = decodeURIComponent(router.params.url || "");

  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [selecting, setSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);
  const [mosaicRects, setMosaicRects] = useState<Rect[]>([]);
  const [processing, setProcessing] = useState(false);

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

  const handleTouchStart = (e: { touches: { x: number; y: number }[] }) => {
    const touch = e.touches[0];
    setSelecting(true);
    setStartPoint({ x: touch.x, y: touch.y });
    setCurrentRect(null);
  };

  const handleTouchMove = (e: { touches: { x: number; y: number }[] }) => {
    if (!selecting) return;

    const touch = e.touches[0];
    const rect: Rect = {
      x: Math.min(startPoint.x, touch.x),
      y: Math.min(startPoint.y, touch.y),
      width: Math.abs(touch.x - startPoint.x),
      height: Math.abs(touch.y - startPoint.y),
    };
    setCurrentRect(rect);
  };

  const handleTouchEnd = () => {
    setSelecting(false);
    if (currentRect && currentRect.width > 10 && currentRect.height > 10) {
      setMosaicRects([...mosaicRects, currentRect]);
      applyMosaic(currentRect);
    }
    setCurrentRect(null);
  };

  const applyMosaic = (rect: Rect) => {
    const ctx = Taro.createCanvasContext(canvasRef.current);

    // 重绘图片
    ctx.drawImage(imageUrl, 0, 0, canvasSize.width, canvasSize.height);

    // 对所有已有区域和新区域应用马赛克
    const allRects = [...mosaicRects, rect];
    allRects.forEach((r) => {
      // 用灰色方块模拟马赛克效果
      const blockSize = 10;
      for (let x = r.x; x < r.x + r.width; x += blockSize) {
        for (let y = r.y; y < r.y + r.height; y += blockSize) {
          // 随机灰度色
          const gray = Math.floor(Math.random() * 100) + 100;
          ctx.setFillStyle(`rgb(${gray}, ${gray}, ${gray})`);
          ctx.fillRect(x, y, blockSize, blockSize);
        }
      }
    });

    ctx.draw();
  };

  const handleUndo = () => {
    if (mosaicRects.length === 0) return;

    const newRects = mosaicRects.slice(0, -1);
    setMosaicRects(newRects);

    // 重绘
    const ctx = Taro.createCanvasContext(canvasRef.current);
    ctx.drawImage(imageUrl, 0, 0, canvasSize.width, canvasSize.height);

    newRects.forEach((r) => {
      const blockSize = 10;
      for (let x = r.x; x < r.x + r.width; x += blockSize) {
        for (let y = r.y; y < r.y + r.height; y += blockSize) {
          const gray = Math.floor(Math.random() * 100) + 100;
          ctx.setFillStyle(`rgb(${gray}, ${gray}, ${gray})`);
          ctx.fillRect(x, y, blockSize, blockSize);
        }
      }
    });

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
        <Text className="tips-text">
          图片将用于 AI
          识别化验指标，除此之外只有您本人可以读写，其他人无法访问。请用手指框选并遮盖姓名、身份证号、住址、电话等敏感信息。点击"确认"即表示您已确认图片中不含敏感个人信息。
        </Text>
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
          {currentRect && (
            <View
              className="selection-rect"
              style={{
                left: `${currentRect.x}px`,
                top: `${currentRect.y}px`,
                width: `${currentRect.width}px`,
                height: `${currentRect.height}px`,
              }}
            />
          )}
        </View>
      </View>

      <View className="action-bar">
        <View
          className={`action-btn undo-btn ${mosaicRects.length === 0 ? "disabled" : ""}`}
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
