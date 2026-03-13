import React, { memo } from 'react';
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';

const FileUploader = memo(({ 
  file, 
  isValid, 
  isValidating, 
  fileInputRef, 
  handleFileDrop, 
  validateFile, 
  resetFile 
}) => {
  return (
    <div className="flex flex-col flex-1 h-full min-h-[200px]">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Step 1 — Upload Scan</h3>

      {!file ? (
        <div
          className="flex-1 border-2 border-dashed border-white/10 hover:border-cyan-500/40 rounded-xl p-6 text-center cursor-pointer transition-all group flex flex-col items-center justify-center min-h-[160px]"
          onDragOver={e => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FaCloudUploadAlt className="text-4xl text-cyan-400/40 mx-auto mb-3 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300"/>
          <p className="text-white/80 text-sm font-bold mb-1">Drop MRI Scan</p>
          <p className="text-text-muted text-[10px] tracking-tight uppercase">.nii .nii.gz .dcm • Max 2GB</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".nii,.nii.gz,.dcm,.dicom"
            onChange={e => e.target.files[0] && validateFile(e.target.files[0])} 
          />
        </div>
      ) : (
        <div className={`flex-1 border-2 rounded-xl p-5 text-center transition-all bg-black/20 flex flex-col items-center justify-center ${
          isValid 
            ? 'border-emerald-500/30' 
            : isValidating 
              ? 'border-cyan-500/30' 
              : 'border-red-500/30'
        }`}>
          <div className="text-3xl mb-3 flex justify-center items-center h-10">
            {isValid ? '✅' : isValidating ? <FaSpinner className="animate-spin text-cyan-400" /> : '❌'}
          </div>
          <p className="text-white text-sm font-black truncate px-2">{file.name}</p>
          <p className="text-gray-500 text-[10px] font-mono mt-1 uppercase">{(file.size/1024/1024).toFixed(2)} MB</p>
          <button 
            onClick={resetFile}
            className="mt-4 px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-cyan-400 transition-colors"
          >
            Replace
          </button>
        </div>
      )}
    </div>
  );
});

export default FileUploader;
