import { useEffect, useRef } from "react"



function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    const BackgroundImage = new Image();
    BackgroundImage.src = '/BackgroundTerrain.png'

    const PlayerImage = new Image()
    PlayerImage.src = "/playerDown.png"

    const keys: { w: boolean, a: boolean, s: boolean, d: boolean } = {
      w: false,
      a: false,
      s: false,
      d: false
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys) keys[key as keyof typeof keys] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys) keys[key as keyof typeof keys] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function gameLoop(): void {
      if (!canvas) return;
      if (!ctx) return;
      BackgroundImage.onload = () => {
        ctx.drawImage(BackgroundImage, -50, -430)
        ctx.drawImage(
          PlayerImage,
          0,
          0,
          PlayerImage.width / 4,
          PlayerImage.height,
          canvas.width / 2 - PlayerImage.width / 4,
          canvas.height / 2 - PlayerImage.height / 2,
          PlayerImage.width / 4,
          PlayerImage.height
        )
      }


      if (keys.w) {
        console.log(keys)
      } else if (keys.a) {
        console.log(keys)
      } else if (keys.s) {
        console.log(keys)
      } else if (keys.d) {
        console.log(keys)
      }

      requestAnimationFrame(gameLoop)
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };


  }, []);




  return (
    <div style={{ backgroundColor: "black" }}>
      <canvas ref={canvasRef}
        width={1024}
        height={576}
      ></canvas>
    </div>
  )
}

export default App
