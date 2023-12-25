import '@/styles/globals.css'
import type { AppProps } from 'next/app'

import './reactCOIServiceWorker';
import Script from 'next/script'
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const unityScriptUrl = `${router.basePath}/Build/html5.loader.js`;
  return<>
  <div className='game-container'>
    <canvas id='canvas' >
                HTML5 canvas appears to be unsupported in the current browser.<br />
                Please try updating or use a different browser.
    </canvas>
  </div>
  <Component {...pageProps} />
  <Script src={unityScriptUrl} strategy='beforeInteractive'></Script>
  </> 
}
