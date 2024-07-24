import React, { useEffect } from "react";
import { Html5QrcodeScanType, Html5QrcodeScanner } from "html5-qrcode";
import { Html5QrcodeResult } from "html5-qrcode/esm/core";

interface BarCodeScannerProps {
  onScanBarCode: (decodeText: string) => void;
}
const BarCodeScanner: React.FC<BarCodeScannerProps> = ({ onScanBarCode }) => {
  useEffect(() => {
    function onScanSuccess(
      decodedText: string,
      decodedResult: Html5QrcodeResult
    ) {
      // Handle on success condition with the decoded text or result.
      console.log(`Scan result: ${decodedText}`, decodedResult);
      onScanBarCode(decodedText);
    }
    function onScanFailure(error: any) {
      // handle scan failure, usually better to ignore and keep scanning.
      // for example:
      console.warn(`Code scan error = ${error}`);
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 60,
        qrbox: { width: 300, height: 200 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    return () => {
      html5QrcodeScanner.clear().catch((error) => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScanBarCode]);

  return (
    <div>
      <div id="reader" />
    </div>
  );
};

export default BarCodeScanner;
