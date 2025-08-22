'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';

export default function Result() {
  const [userName, setUserName] = useState('');
  const [quizResult, setQuizResult] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMintOpen, setIsMintOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<'idle' | 'uploading' | 'minting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 從 localStorage 獲取用戶名稱和測驗結果
    const storedUserName = localStorage.getItem('userName');
    const storedResult = localStorage.getItem('quizResult');
    const storedContract = localStorage.getItem('contractAddress');
    
    if (storedUserName && storedResult) {
      setUserName(storedUserName);
      setQuizResult(storedResult);
      if (storedContract) setContractAddress(storedContract);
    } else {
      // 如果沒有數據，重定向到首頁
      router.push('/');
    }
  }, [router]);

  const generateImage = async () => {
    if (!userName || !quizResult) return;
    setIsGenerating(true);

    try {
      const width = 900; // 3:4 aspect (900x1200)
      const height = 1200;
      const margin = 40;
      const headerHeight = 160;
      const footerHeight = 100;

      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#fde2e4');
      grad.addColorStop(1, '#e0e7ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Card container
      const cardX = margin;
      const cardY = margin;
      const cardW = width - margin * 2;
      const cardH = height - margin * 2;
      const radius = 32;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      roundedRect(ctx, cardX, cardY, cardW, cardH, radius);
      ctx.fill();

      // Title: "[User]'s Soulpet — [Animal]"
      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 56px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const title = `${userName}'s Soulpet — ${quizResult}`;
      ctx.fillText(title, width / 2, cardY + 36);

      // Load animal image
      const imgUrl = `/assets/animals/${quizResult}.png`;
      const animalImg = await loadImage(imgUrl);

      // Compute image box
      const maxImgW = cardW - 80;
      const maxImgH = height - headerHeight - footerHeight - margin * 2 - 40;
      const { drawW, drawH } = fitContain(animalImg.width, animalImg.height, maxImgW, maxImgH);
      const imgX = width / 2 - drawW / 2;
      const imgY = cardY + headerHeight + (maxImgH - drawH) / 2;

      // Shadow circle behind image
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.ellipse(width / 2, imgY + drawH + 30, drawW * 0.35, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw animal image
      ctx.drawImage(animalImg, imgX, imgY, drawW, drawH);

      // Footer date and label
      const today = new Date().toISOString().split('T')[0];
      ctx.fillStyle = '#4b5563';
      ctx.font = '500 36px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(today, width / 2, height - margin - 36);

      // No subtitle; animal already included in the title above

      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedUrl(dataUrl);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      if (!generatedUrl) await generateImage();

      const navAny = navigator as any;
      const supportsFileShare = !!(navAny?.canShare) && (() => {
        try {
          // Quick capability probe for file sharing
          return navAny.canShare({ files: [new File([new Blob()], 'probe.png', { type: 'image/png' })] });
        } catch {
          return false;
        }
      })();

      if (supportsFileShare) {
        const resp = await fetch(generatedUrl);
        const blob = await resp.blob();
        const fileName = `Soulpet-${userName}-${quizResult}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        await navAny.share({
          files: [file],
          title: `${userName}'s Soulpet`,
          text: `My Soulpet is ${quizResult}!`,
        });
        return;
      }

      // Fallback: URL/text share (no auto-download). Some browsers require https URL, so share the page URL.
      if (navigator.share) {
        await navigator.share({
          title: `${userName}'s Soulpet`,
          text: `My Soulpet is ${quizResult}!`,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        });
        return;
      }

      // Last resort: show a friendly hint instead of forcing a download
      alert('Sharing is not supported on this browser. Please use “Save PNG” to download and share manually.');
    } catch (e) {
      console.error('Share failed', e);
      alert('Sharing failed. Please try “Save PNG” to download and share manually.');
    }
  };

  const handleMint = async () => {
    if (!walletAddress.trim()) {
      setErrorMessage('Please enter a wallet address');
      return;
    }

    setIsMinting(true);
    setMintStatus('minting');
    setErrorMessage('');

    try {
      // 1. 先上傳圖片到 Cloudinary
      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: generatedUrl }),
      });
      
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson?.message || 'Image upload failed');
      }
      
      const imageUrl = uploadJson.imageUrl;
      console.log('Image uploaded:', imageUrl);

      // 2. 用圖片 URL 來 mint NFT
      const claimBody: any = {
        recipientAddress: walletAddress.trim(),
        userName,
        animalType: quizResult,
        imageUrl
      };
      if (contractAddress) claimBody.contractAddress = contractAddress;
      
      console.log('Claim body:', claimBody);

      let claimRes = await fetch('/api/drops/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimBody),
      });
      let claimJson = await claimRes.json();
      console.log('Claim response:', claimJson);
      if (!(claimRes.ok) && String(claimJson?.message || '').includes('Missing contractAddress')) {
        // 自動部署合約後再嘗試一次
        const deployRes = await fetch('/api/drops/deploy', { method: 'POST' });
        const deployJson = await deployRes.json();
        console.log('Auto deploy response:', deployJson);
        if (!deployRes.ok || !deployJson?.data) {
          throw new Error(deployJson?.message || 'Auto deploy failed');
        }
        const deployedAddr =
          deployJson?.usedContractAddress ||
          deployJson?.data?.contractAddress ||
          deployJson?.data?.contract?.address ||
          deployJson?.data?.address ||
          null;
        if (!deployedAddr) throw new Error('Cannot read contractAddress from deploy response');
        setContractAddress(deployedAddr);
        try { localStorage.setItem('contractAddress', deployedAddr); } catch {}

        // retry claim with address
        claimBody.contractAddress = deployedAddr;
        claimRes = await fetch('/api/drops/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(claimBody),
        });
        claimJson = await claimRes.json();
        console.log('Claim response (after deploy):', claimJson);
      }

      if (claimRes.ok && claimJson?.success) {
        setMintStatus('success');
        if (claimJson?.usedContractAddress) {
          // @ts-ignore local state created earlier optional
          setContractAddress(claimJson.usedContractAddress as string);
        }
      } else {
        throw new Error(claimJson?.message || 'Mint failed');
      }
    } catch (e) {
      setMintStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'Mint failed');
    }
  };

  const handleDownload = () => {
    if (!generatedUrl) return;
    const a = document.createElement('a');
    a.href = generatedUrl;
    a.download = `Soulpet-${userName}-${quizResult}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fitContain(srcW: number, srcH: number, maxW: number, maxH: number) {
    const ratio = Math.min(maxW / srcW, maxH / srcH);
    return { drawW: Math.round(srcW * ratio), drawH: Math.round(srcH * ratio) };
  }

  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  const handleRestart = () => {
    // 清除 localStorage 並重新開始
    localStorage.removeItem('userName');
    localStorage.removeItem('quizResult');
    localStorage.removeItem('quizAnswers');
    router.push('/');
  };

  useEffect(() => {
    if (userName && quizResult) {
      generateImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName, quizResult]);

  if (!userName || !quizResult) {
    return <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  const closeModal = () => {
    setIsMintOpen(false);
    setMintStatus('idle');
    setWalletAddress('');
    setErrorMessage('');
    setContractAddress(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
              Your Result
            </h1>
            <p className="text-gray-600">Congratulations {userName}! You've discovered your spirit animal.</p>
          </div>

          {/* 產出結果圖：預覽 */}
          <div className="mt-6">
            {generatedUrl ? (
              <div>
                <img
                  src={generatedUrl}
                  alt="Generated result"
                  className="mx-auto rounded-xl shadow border"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            ) : (
              <div className="text-gray-500">{isGenerating ? 'Generating image...' : 'Preview will appear here.'}</div>
            )}
          </div>

          {/* 隱藏 canvas 用於生成圖片 */}
          <canvas ref={canvasRef} width={900} height={1200} style={{ display: 'none' }} />

          {/* 操作按鈕 */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button
              onClick={() => setIsMintOpen(true)}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
            >
              Mint
            </button>
            <button
              onClick={handleDownload}
              disabled={!generatedUrl}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Save PNG
            </button>
            <button
              onClick={handleRestart}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold text-lg hover:bg-gray-300 transform hover:scale-105 transition-all duration-200"
            >
              Take Quiz Again
            </button>
          </div>
        </div>
        {/* Mint Modal */}
        {isMintOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
              <div className="mb-4 text-center">
                <h3 className="text-xl font-bold text-gray-900">Mint your Soulpet</h3>
                <p className="text-gray-600 mt-1">Enter your wallet address to receive the NFT.</p>
              </div>
              <div className="mb-4">
                <label htmlFor="wallet" className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                <input
                  id="wallet"
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:outline-none transition-colors"
                  disabled={isMinting}
                />
              </div>
              {errorMessage && (
                <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg border border-red-300">{errorMessage}</div>
              )}
              {mintStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 text-center mb-4">
                    Mint request completed!
                  </p>
                  {contractAddress && (
                    <div className="text-center">
                      <a
                        href={`https://biru.gg/collections/soneium:${contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        View on Biru
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {mintStatus === 'success' ? 'Close' : 'Cancel'}
                </button>
                {mintStatus !== 'success' && (
                  <button
                    onClick={handleMint}
                    disabled={isMinting}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMinting ? 'Minting...' : 'Mint'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* View on Biru button below page content (shown after success) */}
        {mintStatus === 'success' && contractAddress && (
          <div className="text-center mt-6">
            <a
              href={`https://biru.gg/collections/soneium:${contractAddress}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-black text-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors"
            >
              View on Biru
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

