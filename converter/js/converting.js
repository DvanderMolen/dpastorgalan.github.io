// Global variable for converter specimens
var specimens = [];

// Returns a Promise<string> with the hex SHA-256 of `message`
function sha256Hex(message) {
  if (!window.crypto || !crypto.subtle) {
    throw new Error("Web Crypto API not available — include a polyfill (e.g. js-sha256).");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });
}


function convert_UTRECHT() {
  console.log("Export Utrecht function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }
  console.log(specimens)
  let content = "";
  content += "\n"; // top header
  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;
    
    // Header
    content += `"${sample}",,${coreAzimuth},${coreDip},${volume},${beddingStrike},${beddingDip}\n`;
    
    steps.forEach(function(step) {
      const a = -step.z * volume;
      const b = -step.x * volume;
      const c = step.y * volume;
      content += `${step.step},${a},${b},${c},${step.error},,\n`;
    });
    
    content += "9999\n";
	console.log(coreAzimuth,coreDip,beddingStrike,beddingDip)
  });

  content += '"END"\n';
  
  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  
  let exportName = specimens[0].originalFile || "converted_specimens.th";
  a.download = exportName.replace(/\.[^/.]+$/, "") + "_converted.th";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_HELSINKI() {
  console.log("Export Helsinki function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, coreAzimuth, coreDip, demagnetizationType, steps } = specimen;

    // ---- Header (first 12 lines, mostly placeholders except a few fields) ----
    // We'll reconstruct enough to make it a valid Helsinki file
    content += ";\n".repeat(5); // lines 0-4: empty placeholders

    // Line 5: sample name + core azimuth
    // Format: ;sampleName;;;;;;coreAzimuth
    content += `;${sample};;;;;;${coreAzimuth}\n`;

    // Line 6: core dip
    content += `;;;;;;;${coreDip}\n`;

    // Line 7: volume and demagnetization type
    // Format: ;;volume;;;;;demagType
    content += `;;${volume};;;;;${demagnetizationType}\n`;

    // Lines 8-11: empty placeholders
    content += ";\n".repeat(4);

    // ---- Measurements ----
    steps.forEach(function(step) {
      // Convert µA/m back to mA/m (divide by 1E3)
      const x = (step.x / 1E3).toFixed(6);
      const y = (step.y / 1E3).toFixed(6);
      const z = (step.z / 1E3).toFixed(6);

      // Build a 24-field row (only some are filled, rest empty)
      let fields = new Array(24).fill("");
      fields[1] = step.step;
      fields[13] = x;
      fields[14] = y;
      fields[15] = z;

      content += fields.join(";") + "\n";
    });
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  console.log(specimens.originalFile)
  let exportName = specimens[0].originalFile || "converted_specimens.csv";
  a.download = exportName.replace(/\.[^/.]+$/, "") + "_converted.csv";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_HELSINKIBLOCK() {
  console.log("Export Helsinki Block function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, coreAzimuth, coreDip, demagnetizationType, steps } = specimen;

    // Reverse transform azimuth back to strike
    const strike = (Number(coreAzimuth) + 90).toFixed(1);

    // Reverse transform dip convention
    const dip = 90 - Number(coreDip);

    // Header block — we need at least 12 lines (the import skips 12)
    // You can expand with the real Helsinki header template if you have it,
    // but here’s a skeleton version to make it compatible with your importer:
    content += ";\n".repeat(5); // filler lines 0-4
    content += `;${sample};;;;;;${strike}\n`; // line 5 (sample + strike)
    content += `;;;;;;;${dip}\n`;              // line 6 (dip)
    content += `;;${volume};;;;;${demagnetizationType}\n`; // line 7 (volume + type)
    content += ";\n".repeat(4); // filler lines 8-11

    // Now add steps (after line 12)
    steps.forEach(function(step) {
      // Reverse conversion (back to mA/m, so divide by 1E3)
      const y = step.y / 1E3;
      const x = -step.x / 1E3;
      const z = step.z / 1E3;

      // Use semicolon-separated fields (24 columns needed)
      // Only filling the key indices used by importer: 1, 5, 6, 13, 14, 15
      // Others stay empty.
      let cols = new Array(24).fill("");
      cols[1] = step.step;
      cols[5] = "0";   // dec (not recovered from import, so placeholder)
      cols[6] = "0";   // inc (not recovered, placeholder)
      cols[13] = y;
      cols[14] = -x;   // undo the negation done in import
      cols[15] = z;

      content += cols.join(";") + "\n";
    });
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  let exportName = specimens[0].originalFile || "converted_specimens.csv";
  a.download = exportName.replace(/\.[^/.]+$/, "") + "_converted.csv";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convertAgicoInverse(coreAzimuth, coreDip, beddingStrike, beddingDip) {
  /*
   * Converts paleomagnetism.org orientation parameters back to AGICO RS3 P1..P4.
   * Only supports the same limited set as convertAgico.
   */

  let P1 = 12;
  let P3 = 12;
  let P2 = 90; // export in "direct dip" mode
  let P4 = 90; // export bedding strike in RHR convention

  return { P1, P2, P3, P4 };
}

function convert_RS3() {
  console.log("Export RS3 function called.");

  if (!Array.isArray(specimens) || specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  // Helpers
  function getXYZ(step) {
    if (!step) return null;
    if (step.coordinates && typeof step.coordinates.x === "number") {
      return step.coordinates;
    }
    if (typeof step.x === "number") {
      return { x: step.x, y: step.y, z: step.z };
    }
    return null;
  }
  function setField(charArr, start, width, value, alignRight = true) {
    let s = value === null || value === undefined ? "" : String(value);
    if (s.length > width) s = s.slice(0, width);
    s = alignRight ? s.padStart(width, " ") : s.padEnd(width, " ");
    for (let i = 0; i < width; i++) {
      charArr[start + i] = s[i];
    }
  }

  let content = "";
  content += " ".repeat(120) + "\n";  //adds top header
  specimens.forEach(function(specimen, sIndex) {
    const sample = (specimen.sample || specimen.name || `S${sIndex}`).toString().slice(0, 8);
    const demag = specimen.demagnetizationType === "thermal" ? "C" : "A";
    const latitude = (typeof specimen.latitude === "number") ? specimen.latitude : null;
    const longitude = (typeof specimen.longitude === "number") ? specimen.longitude : null;
    const coreAzimuth = Number(specimen.coreAzimuth) || 0;
    const coreDip = Number(specimen.coreDip) || 0;
    const beddingStrike = Number(specimen.beddingStrike) || 0;
    const beddingDip = Number(specimen.beddingDip) || 0;
    const steps = Array.isArray(specimen.steps) ? specimen.steps : [];
	console.log(coreAzimuth,coreDip,beddingStrike,beddingDip)
    const agicoParams = convertAgicoInverse(coreAzimuth, coreDip, beddingStrike, beddingDip);

    // Build header line (fixed columns)
    let header = "";
    header += sample.padEnd(8, " ");          
    header += " ".repeat(13);                 
    header += (latitude !== null ? latitude.toFixed(2).padStart(4, " ") : "    "); 
    header += " ".repeat(6);                  
    header += (longitude !== null ? longitude.toFixed(2).padStart(4, " ") : "    "); 
    header += " ".repeat(39);                 
    header += String(coreAzimuth).padStart(3, " "); 
    header += " ".repeat(2);                  
    header += String(coreDip).padStart(3, " ");    
    header += " ".repeat(4);                  
    header += String(beddingStrike).padStart(4, " "); 
    header += " ".repeat(2);                  
    header += String(beddingDip).padStart(3, " ");    
    header += " ".repeat(15);                 
    header += String(agicoParams.P1).padStart(2, " "); 
    header += String(agicoParams.P2).padStart(3, " "); 
    header += String(agicoParams.P3).padStart(3, " "); 
    header += String(agicoParams.P4).padStart(3, " "); 
    header += "\n";

    content += header;

    // second line: demag char
    let secondLineArr = new Array(12).fill(" ");
    setField(secondLineArr, 4, 1, demag, true);
    content += secondLineArr.join("") + "\n";

    // step lines
    steps.forEach(function(stepObj, idx) {
      const lineArr = new Array(120).fill(" ");
      const stepNum = (stepObj && (stepObj.step !== undefined ? stepObj.step : (idx + 1)));

      setField(lineArr, 3, 3, stepNum, true);

      const xyz = getXYZ(stepObj) || { x: 0, y: 0, z: 0 };
      const { x, y, z } = xyz;
      const magnitude = Math.sqrt(x*x + y*y + z*z) || 0;
      const intensityFieldValue = magnitude / 1e6;

      setField(lineArr, 15, 12, intensityFieldValue.toFixed(6), true);

      let decl = (Math.atan2(x, y) * 180.0 / Math.PI);
      if (decl < 0) decl += 360;
      let incl = (Math.atan2(z, Math.sqrt(x*x + y*y)) * 180.0 / Math.PI);

      setField(lineArr, 28, 5, decl.toFixed(1), true);
      setField(lineArr, 34, 5, incl.toFixed(1), true);

      const a95 = (stepObj && stepObj.error !== undefined) ? stepObj.error : 0;
      setField(lineArr, 77, 3, Math.round(a95), true);

      content += lineArr.join("") + "\n";
    });
  });

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  let exportName = specimens[0].originalFile || "converted_specimens.csv";
  a.download = exportName.replace(/\.[^/.]+$/, "") + "_converted.rs3";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



function convert_CALTECH() {
  console.log("Export Caltech function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;

    // First line: sample name
    content += sample + "\n";

    // Second line: core & bedding parameters
    // Recall that in importCaltech we did:
    //   coreAzimuth = (rawAzimuth + 270) % 360
    //   coreDip = 90 - rawDip
    // So we invert those here
    const rawAzimuth = (coreAzimuth + 90) % 360;   // inverse of +270 % 360
    const rawDip = 90 - coreDip;

    const paramLine = 
      rawAzimuth.toString().padStart(5, " ") +
      rawDip.toString().padStart(5, " ") +
      beddingStrike.toString().padStart(5, " ") +
      beddingDip.toString().padStart(6, " ") +
      volume.toString().padStart(6, " ");
    content += paramLine + "\n";

    // Now for the steps
    steps.forEach(function(step) {
      // We have Cartesian specimen coords in µA/m.
      // Convert back to Direction (dec/inc, intensity).
      const dir = step.coordinates.toVector(Direction);

      const intensity = (dir.intensity / 1e9).toExponential(3).padStart(9, " "); // back to emu/cm^3
      const a95 = step.error ? step.error.toString().padStart(5, " ") : "     ";
      const dec = dir.dec.toFixed(1).padStart(5, " ");
      const inc = dir.inc.toFixed(1).padStart(5, " ");

      // Placeholders for GDec/GInc and TDec/TInc
      const GDec = " 0.0".padStart(5, " ");
      const GInc = " 0.0".padStart(5, " ");
      const TDec = " 0.0".padStart(5, " ");
      const TInc = " 0.0".padStart(5, " ");

      // Step label
      const stepLabel = step.step.toString().padStart(6, " ");

      // Build line (fixed-column style as Caltech expects)
      const line =
        stepLabel +        // 0–6 chars
        GDec +             // 7–12
        GInc +             // 13–18
        TDec +             // 19–24
        TInc +             // 25–30
        intensity +        // 31–39
        a95 +              // 40–45
        dec +              // 46–51
        inc +              // 52–57
        " ".repeat(28) +   // pad until 85
        "INFO";            // placeholder metadata (85–113)
      content += line + "\n";
    });
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.caltech";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_LDGO() {
  console.log("Export LDGO function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "Sample\tStep\tDec\tInc\tInt\tCoreAzimuth\tCoreHade\tBeddingStrike\tBeddingDip\tVolume\n";

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;

    // Convert back LDGO-specific values
    const hade = 90 - coreDip;
    const ldgoStrike = (beddingStrike + 90) % 360;

    steps.forEach(function(step) {
      // Convert cartesian coords back to direction (dec, inc, intensity)
      const dir = new Coordinates(step.x, step.y, step.z).toDirection();

      const dec = dir.dec;
      const inc = dir.inc;
      const intensity = dir.intensity / 1E6; // convert uA/m back to A/m

      content += `${sample}\t${step.step}\t${dec}\t${inc}\t${intensity}\t${coreAzimuth}\t${hade}\t${ldgoStrike}\t${beddingDip}\t${volume}\n`;
    });
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.ldgo";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_BCN2G() {
  console.log("Export BCN2G function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;

    // --- Header block ---
    // BCN2G expects \u0002 at start
    content += "\u0002";

    // Pad sample name to 7 chars
    let sampleName = (sample || "").padEnd(7, "\0").slice(0, 7);

    // Pad numeric fields to correct widths
    let volStr = String(volume).padEnd(2, "\0").slice(0, 2);
    let coreAzStr = String(coreAzimuth).padEnd(3, "\0").slice(0, 3);
    let coreDipStr = String(coreDip).padEnd(2, "\0").slice(0, 2);
    let bedStrikeStr = String((beddingStrike + 90) % 360).padEnd(3, "\0").slice(0, 3); // reverse transform
    let bedDipStr = String(beddingDip).padEnd(2, "\0").slice(0, 2);

    // Stubbed declination correction and overturn bit (for now)
    let declStr = "0000";
    let overturnBit = "\0";

    // Build header line (positions approximate, you may need to tune to exact spec)
    let header =
      "#####".padEnd(5, "\0") + // dummy prefix
      sampleName +
      "\0".repeat(2) +
      volStr +
      "\0".repeat(85) +
      coreAzStr +
      "\0" +
      coreDipStr +
      "\0" +
      bedStrikeStr +
      "\0" +
      bedDipStr +
      overturnBit +
      "\0".repeat(12) +
      declStr;

    content += header;

    // --- Steps ---
    steps.forEach(function(step) {
      // Convert cartesian to direction
      let dir = new Direction().fromCartesian(step.x, step.y, step.z);

      let stepStr = [
        "", // filler
        "", // filler
        "", // filler
        step.step,
        dir.dec.toFixed(2),
        dir.inc.toFixed(2),
        "", "", "", "", "",
        (step.intensity / 1e9).toExponential(6), // back to emu/cm^3
        "", "", "", "", "", "", "", "", "", "", "", "", ""
      ].join("\0");

      content += stepStr + "\u0000";
    });

    // Close specimen with \u0003
    content += "\u0003";
  });

  // Create blob and download
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.bcn2g";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_MUNICH() {
  console.log("Export Munich function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, coreAzimuth, coreDip, beddingStrike, beddingDip, steps } = specimen;

    // Convert back hade angle and bedding strike
    const hade = 90 - coreDip;
    const originalStrike = (beddingStrike + 90) % 360;

    // Header line
    content += `${sample}, ${coreAzimuth}, ${hade}, ${originalStrike}, ${beddingDip}, ""\n`;

    // Steps
    steps.forEach(function(step) {
      // Convert back to Direction (dec/inc/intensity)
      const dir = step.coordinates.toDirection();
      const intensity_mA = dir.intensity / 1000.0; // back to mA

      content += `${step.step}, ${intensity_mA}, ${step.error}, ${dir.dec}, ${dir.inc}\n`;
    });
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.munich";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_CENIEHREGULAR() {
  console.log("Export Cenieh Regular function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen, i) {
    const { sample, steps, coreAzimuth, coreDip, beddingStrike, beddingDip, demagnetizationType } = specimen;

    // Header: file format expects "SampleName <tab> AF/TH ..."
    const typeString = demagnetizationType === "alternating" ? "AF" : "TH";
    content += `${sample}\t${typeString}\n`;

    steps.forEach(function(step) {
      // Cartesian coords back to Direction
      const dir = new Coordinates(step.x, step.y, step.z).toVector(Direction);
      let intensity = dir.r * 1E-9; // back to emu/cc
      let dec = dir.dec;
      let inc = dir.inc;

      // Rotated vectors
      let rotated = new Coordinates(step.x, step.y, step.z)
        .rotateTo(coreAzimuth, coreDip)
        .toVector(Direction);

      // Tectonic rotated vectors
      let tectonic = new Coordinates(step.x, step.y, step.z)
        .rotateTo(coreAzimuth, coreDip)
        .correctBedding(beddingStrike, beddingDip)
        .toVector(Direction);

      // Line: sampleName step intensity dec inc rotDec rotInc ... tectDec tectInc
      // Fill with blanks/tabs for unneeded cols
      content += [
        sample,
        step.step,
        intensity.toExponential(6), // keep similar numeric style
        dec.toFixed(2),
        inc.toFixed(2),
        rotated.dec.toFixed(2),
        rotated.inc.toFixed(2),
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", // placeholders
        tectonic.dec.toFixed(2),
        tectonic.inc.toFixed(2)
      ].join("\t") + "\n";
    });

    // Add blank line between specimens if multiple
    if (i < specimens.length - 1) {
      content += "\n";
    }
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.cenieh";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_CENIEH() {
  console.log("Export Cenieh function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  // Write a header (CENIEH files always start with one)
  content += "SAMPLE STEP INTENSITY DEC INC .... LEVEL\n";

  specimens.forEach(function(specimen) {
    const { sample, steps } = specimen;

    steps.forEach(function(step) {
      // Convert cartesian coords back into direction
      const direction = step.coordinates.toDirection();
      const intensity = direction.intensity / 1e6; // import scaled by 1E6
      const declination = direction.declination;
      const inclination = direction.inclination;

      // Extract level (CENIEH requires sampleName = base.level)
      let base = sample;
      let level = "";
      if (sample.includes(".")) {
        const parts = sample.split(".");
        base = parts[0];
        level = parts[1];
      }

      // Compose line: only the fields used matter
      // placeholders for unused columns ("....")
      content += `${base} ${step.step} ${intensity.toFixed(6)} ${declination.toFixed(2)} ${inclination.toFixed(2)} .... ${level}\n`;
    });
  });

  // Create and download file
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.cenieh";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_NGU() {
  console.log("Export NGU function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;

    // NGU header
    // Remember: NGU uses different conventions:
    // - coreDip is stored as 90 - coreDip
    // - beddingStrike stored as (beddingStrike - 90) % 360
    const nguCoreDip = 90 - coreDip;
    const nguBeddingStrike = (beddingStrike + 90) % 360;

    content += `${sample} ${coreAzimuth} ${nguCoreDip} ${nguBeddingStrike} ${beddingDip} Info\n`;

    // NGU steps: convert Cartesian back to Dec/Inc/Intensity
    steps.forEach(function(step) {
      const intensity = Math.sqrt(step.x ** 2 + step.y ** 2 + step.z ** 2);
      const dec = Math.atan2(step.x, step.y) * (180 / Math.PI);
      const inc = Math.asin(step.z / intensity) * (180 / Math.PI);

      // Intensity in μA -> convert back to mA
      const intensity_mA = intensity / 1E3;

      content += `${step.step} ${intensity_mA} ${dec.toFixed(2)} ${inc.toFixed(2)} ${step.error}\n`;
    });

  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.ngu";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_ANGLIA() {
  console.log("Export Anglia function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;

    // Adjust beddingStrike back to Anglia's convention
    const angliaBeddingStrike = (beddingStrike + 90) % 360;

    // Header line (Anglia format: SampleName CoreAz CoreDip BeddingStrike BeddingDip Volume Info?)
    content += `${sample} ${coreAzimuth} ${coreDip} ${angliaBeddingStrike} ${beddingDip} ${volume}\n`;

    steps.forEach(function(step) {
      // Convert from col format coordinates back to Anglia format
      const x = -step.x; // Flip x coordinate
      const y = step.y;
      const z = step.z;

      // Convert Cartesian back to spherical (intensity, dec, inc)
      const intensity = Math.sqrt(x*x + y*y + z*z) / 1E3; // back to mA
      const dec = Math.atan2(y, x) * 180 / Math.PI; // degrees
      const inc = Math.asin(z / Math.sqrt(x*x + y*y + z*z)) * 180 / Math.PI; // degrees

      content += `${step.step} ${intensity} 0 0 0 ${dec} ${inc}\n`; // fill unused fields with 0
    });
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.ang";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_OXFORD() {
  console.log("Export Oxford function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps, demagnetizationType } = specimen;

    // Build header line (Oxford often has two header lines, we mimic a simple one)
    content += `Specimen\tType\tDemagMethod\tStep\tX\tY\tZ\tIntensity\tDec\tInc\tOther1\tOther2\n`;

    steps.forEach(function(step) {
      const intensity = Math.sqrt(step.x**2 + step.y**2 + step.z**2) * volume / 1E6; // reverse uAm/m -> original units
      const dir = new Direction().fromCartesian(step.coordinates); // Assuming Direction class can do this
      const dec = dir.dec;
      const inc = dir.inc;

      // Determine step column
      let stepCol;
      if(demagnetizationType === "thermal") {
        stepCol = step.step; // mapped to column 4 in import
      } else if(demagnetizationType === "alternating") {
        stepCol = step.step; // mapped to column 3 in import
      }

      content += [
        sample,                 // Specimen
        "",                     // Type (optional)
        demagnetizationType,    // DemagMethod
        stepCol,                // Step
        "", "", "",             // X, Y, Z (unused in original import)
        intensity,              // Intensity (column 6)
        dec,                    // Dec (column 11)
        inc,                    // Inc (column 12)
        "", ""                  // Other1, Other2
      ].join("\t") + "\n";
    });

    content += "\n"; // separate specimens by blank line
  });

  // Create blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.txt";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_PALEOMAC() {
  console.log("Export PaleoMac function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = " "; // initial line to match your LINE_REGEXP slice in import

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;

    // Header formatting (fixed width)
    // Positions based on importPaleoMac slices
    const sampleName = sample.padEnd(9, ' ');
    const coreAz = coreAzimuth.toString().padStart(5, ' ');
    const coreHade = (90 - coreDip).toString().padStart(5, ' ');
    const beddingStr = beddingStrike.toString().padStart(5, ' ');
    const beddingDp = beddingDip.toString().padStart(5, ' ');
    const vol = (volume / 1E6).toFixed(2).toString().padStart(7, ' ');

    content += `${sampleName}   ${coreAz} ${coreHade}   ${beddingStr} ${beddingDp}                       ${vol}\n`;

    // Add steps
    steps.forEach(function(step) {
      const stepNum = step.step.toString().padStart(5, ' ');
      const x = (step.x * volume / 1E6).toFixed(2).toString().padStart(9, ' ');
      const y = (step.y * volume / 1E6).toFixed(2).toString().padStart(11, ' ');
      const z = (step.z * volume / 1E6).toFixed(2).toString().padStart(9, ' ');
      const a95 = (step.error || 0).toFixed(0).toString().padStart(4, ' ');

      content += `${stepNum}${x}${y}${z}                                      ${a95}\n`;
    });

    // Footer line (optional depending on PaleoMac)
    content += "\n";
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.pal";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



function convert_JR6() {
  console.log("Export JR6 function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, steps, coreAzimuth, coreDip, beddingStrike, beddingDip, volume } = specimen;

    steps.forEach(function(step) {
      // Reverse Coordinates scaling
      const x = step.x / 1e6; // Step values in import used exp factor
      const y = step.y / 1e6;
      const z = step.z / 1e6;

      // Determine exponent (power of 10)
      let exp = 0;
      let maxComp = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
      if (maxComp !== 0) {
        exp = Math.floor(Math.log10(maxComp));
      }
      const scale = Math.pow(10, exp);
      const X = (x / scale).toFixed(0).padStart(6, ' ');
      const Y = (y / scale).toFixed(0).padStart(6, ' ');
      const Z = (z / scale).toFixed(0).padStart(6, ' ');

      const stepStr = step.step.toString().padEnd(8, ' ');
      const sampleStr = sample.padEnd(10, ' ');
      const coreAzStr = coreAzimuth.toString().padStart(4, ' ');
      const coreDipStr = coreDip.toString().padStart(4, ' ');
      const beddingStrikeStr = beddingStrike.toString().padStart(4, ' ');
      const beddingDipStr = beddingDip.toString().padStart(4, ' ');
      const a95Str = step.error ? step.error.toFixed(0).padStart(4, ' ') : '   0';
      
      // AGICO fields: For now, we can put placeholders
      const P1 = '000';
      const P2 = '000';
      const P3 = '000';
      const P4 = '000';

      content += `${sampleStr}${stepStr}${X}${Y}${Z}${exp.toString().padStart(4, ' ')}${coreAzStr}${coreDipStr}${beddingStrikeStr}${beddingDipStr}    ${P1}${P2}${P3}${P4}${a95Str}\n`;
    });
  });

  // Create blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.jr6";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_JR5() {
  console.log("Export JR5 function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;

    steps.forEach(function(step) {
      const exp = Math.floor(Math.log10(Math.abs(step.x || 1e-12) * 1e6));
      const factor = 1E6 * Math.pow(10, exp);

      const x = (step.x * volume) / factor;
      const y = (step.y * volume) / factor;
      const z = (step.z * volume) / factor;

      // JR5 uses fixed-width columns:
      // 0-9: sample name
      // 10-17: step
      // 18-23: x
      // 24-29: y
      // 30-35: z
      // 36-39: exponent (power of 10)
      // 40-43: coreAzimuth
      // 44-47: coreDip
      // 48-51: beddingStrike
      // 56-59: beddingDip
      content +=
        sample.padEnd(10) +
        String(step.step).padEnd(8) +
        String(x.toFixed(0)).padStart(6) +
        String(y.toFixed(0)).padStart(6) +
        String(z.toFixed(0)).padStart(6) +
        String(exp).padStart(4) +
        String(coreAzimuth).padStart(4) +
        String(coreDip).padStart(4) +
        String(beddingStrike).padStart(4) +
        "    " + // blank space for 52-55
        String(beddingDip).padStart(4) +
        "\n";
    });

  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.jr5";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_BLACKMOUNTAIN() {
  console.log("Export Black Mountain function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;

    // For Black Mountain, volume is not used; intensities are in A/m already
    steps.forEach(function(step) {
      const x = step.x; // Already in A/m
      const y = step.y;
      const z = step.z;

      // Using placeholder values for unused columns (like geographic/tectonic vectors)
      // Column order roughly: step, X, Y, Z, ..., GDec, GInc, ..., TDec, TInc, ..., coreAz, coreDip, beddingStrike, beddingDip
      const placeholder = 0;

      content += [
        step.step,     // step number
        x, y, z,       // X, Y, Z components in A/m
        placeholder,   // column 4
        placeholder,   // column 5
        placeholder,   // column 6
        placeholder,   // column 7
        placeholder,   // column 8
        placeholder,   // column 9
        0, 0,          // GDec, GInc (placeholder)
        placeholder,   // column 12
        placeholder,   // column 13
        placeholder,   // column 14
        placeholder,   // column 15
        0, 0,          // TDec, TInc (placeholder)
        placeholder,   // column 18
        coreAzimuth,   // coreAzimuth
        coreDip,       // coreDip
        beddingStrike, // beddingStrike
        beddingDip     // beddingDip
      ].join(" ") + "\n";
    });
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.anu";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_UNKNOWN() {
  console.log("Export Unknown function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;

    steps.forEach(function(step) {
      const x = step.x / 1E9; // convert back from Am^2 to original units
      const y = step.y / 1E9;
      const z = step.z / 1E9;

      // Step value
      const stepValue = step.step;

      // Assuming Unknown format has 45 columns like in importUnknown
      let line = new Array(45).fill("");

      // Column assignments (based on importUnknown)
      line[0] = sample;              // sample name
      line[1] = stepValue;           // step in degmagnetization column
      line[5] = volume;              // sample volume
      line[7] = coreAzimuth;         // coreAzimuth
      line[8] = 180 - (90 - coreDip); // coreDip in original orientation
      line[9] = beddingStrike;       // beddingStrike
      line[10] = beddingDip;         // beddingDip
      line[21] = x;                  // X component
      line[22] = y;                  // Y component
      line[23] = z;                  // Z component

      // Other columns can remain empty
      content += line.join("\t") + "\n";
    });

    // Optional: add a blank line or separator if needed
    content += "\n";
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.txt";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_PALEOMAG() {
  console.log("Export PaleoMag function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, volume, beddingStrike, beddingDip, coreAzimuth, coreDip, level, steps } = specimen;

    // First line: sample name
    content += `${sample}\n`;

    // Second line: parameters (level, coreAzimuth, coreDip, beddingStrike, beddingDip, volume)
    // Reversing the CIT convention for coreAzimuth and coreDip
    const coreAz = ((coreAzimuth + 90) % 360).toFixed(0);
    const coreDp = (90 - coreDip).toFixed(0);
    content += ` ${level} ${coreAz} ${coreDp} ${beddingStrike} ${beddingDip} ${volume}\n`;

    // Steps
    steps.forEach(function(step) {
      // Convert Cartesian coordinates back to dec/inc/intensity
      const dir = Direction.fromCartesian(step); // assuming Direction has a static constructor from Measurement
      const dec = dir.dec.toFixed(1).padStart(5);
      const inc = dir.inc.toFixed(1).padStart(5);
      const intensity = (dir.intensity / 1E9).toFixed(8).padStart(8); // reverse uA/m -> emu/cm3

      const stepNum = step.step.toString().padStart(4, " ");
      const a95 = (step.error || 0).toFixed(1).padStart(5);
      const info = "".padEnd(28);

      content += `${stepNum}${dec}${inc}${intensity}${a95}${info}\n`;
    });
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.pmag";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_MAGIC() {
  console.log("Export MagIC function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  // MagIC tables header delimiter
  const DELIM = ">>>>>>>>>>";

  // We'll create each table as an array of lines
  let contributionTable = [
    "contribution\tcontribution_id\tcontributor\tdata_model_version",
    "contribution\tcontrib1\tAnonymous\t3.0"
  ];
  let sitesTable = [
    "sites\tsite\tlat\tlon\tage\tage_low\tage_high\tage_sigma",
    "sites\tSite1\t0\t0\t\t\t\t"
  ];
  let samplesTable = [
    "samples\tsample\tsite\tlevel\tbed_dip_direction\tbed_dip\tazimuth\tdip",
  ];
  let specimensTable = [
    "specimens\tspecimen\tsample\tvolume\tmeas_step_min\tmeas_step_max\tmeas_step_unit\tmethod_codes",
  ];
  let measurementsTable = [
    "measurements\tmeasurement\tspecimen\ttreat_temp\ttreat_ac_field\tdir_dec\tdir_inc\tmagn_volume\tmagn_moment\tmethod_codes"
  ];

  // Keep track of sample & site mapping
  let sampleCounter = 1;
  let siteCounter = 1;
  let siteName = "Site" + siteCounter;

  specimens.forEach(function(specimen) {
    // Add sample row (assuming one specimen = one sample for simplicity)
    let sampleName = specimen.sample;
    samplesTable.push(`${sampleName}\t${siteName}\t${specimen.level || ""}\t${specimen.beddingStrike || ""}\t${specimen.beddingDip || ""}\t${specimen.coreAzimuth || ""}\t${specimen.coreDip || ""}`);

    // Determine min/max steps
    let minStep = Math.min(...specimen.steps.map(s => s.step));
    let maxStep = Math.max(...specimen.steps.map(s => s.step));
    let stepUnit = specimen.demagnetizationType === "alternating" ? "mT" : "C";

    // Determine method codes
    let methodCodes = specimen.demagnetizationType === "alternating" ? "LP-DIR-AF" : "LP-DIR-T";

    // Add specimen row
    specimensTable.push(`${specimen.sample}\t${sampleName}\t${specimen.volume || 1E-5}\t${minStep}\t${maxStep}\t${stepUnit}\t${methodCodes}`);

    // Add measurement rows
    specimen.steps.forEach(function(step) {
      let treatTemp = null, treatAF = null;

      if(specimen.demagnetizationType === "thermal") {
        treatTemp = step.step + (stepUnit === "K" ? 273 : 0);
      } else if(specimen.demagnetizationType === "alternating") {
        treatAF = step.step;
      }

      // Convert x, y, z back to declination/inclination
      let dir = Direction.fromCartesian(step); // assuming you have a helper
      measurementsTable.push(`${step.step}\t${treatTemp || ""}\t${treatAF || ""}\t${dir.dec}\t${dir.inc}\t${specimen.volume || ""}\t${step.moment || ""}\t${methodCodes}`);
    });

  });

  // Combine tables into final content
  let content = [
    DELIM, contributionTable.join("\n"),
    DELIM, sitesTable.join("\n"),
    DELIM, samplesTable.join("\n"),
    DELIM, specimensTable.join("\n"),
    DELIM, measurementsTable.join("\n")
  ].join("\n");

  // Create blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.magic";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_RENNES() {
  console.log("Export Rennes function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, name, volume, latitude, longitude, beddingStrike, beddingDip, coreAzimuth, coreDip, steps } = specimen;

    // Header block (simplified, matches what importRennes expects)
    content += "--------------  Parameters sample & data   ----------------\n";
    content += `Sample: ${sample}\n`;
    content += `Name: ${name}\n`;
    content += `Volume: ${volume}\n`;
    content += `Latitude: ${latitude} N\n`;
    content += `Longitude: ${longitude} E\n`;
    content += "...\n"; // Lines 5-9 not strictly used, placeholder
    content += "Orientation: A12_0_3_9\n"; // Required by your importRennes
    content += `CoreAzimuth: ${coreAzimuth + 90}\n`; // reverse the flipping done during import
    content += `CoreDip: ${90 - coreDip}\n`;
    content += `BeddingStrike: ${beddingStrike}\n`;
    content += `BeddingDip: ${beddingDip}\n`;

    // Step data
    steps.forEach(function(step) {
      const dir = step.coordinates.toDirection(); // convert Cartesian to dec/inc/intensity
      const intensity = dir.intensity / 1E6; // Convert back to original units expected by Rennes
      const dec = dir.dec;
      const inc = dir.inc;

      content += `Step ${step.step}  ...  ${intensity.toFixed(6)}  ...  ${dec.toFixed(2)}  ${inc.toFixed(2)}\n`;
    });

    // Optional separator for next specimen
    content += "\n";
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.txt";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_MONTPELLIER() {
  console.log("Export Montpellier function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = " Sample Step Intensity Dec Inc Azimuth Plunge Strike Dip\n";

  specimens.forEach(function(specimen) {
    const { sample, coreAzimuth, coreDip, beddingStrike, beddingDip, steps } = specimen;

    steps.forEach(function(step) {
      // Convert Cartesian back to direction + intensity
      const dir = new Direction().fromCartesian(step.coordinates);
      const intensity = dir.intensity / 1e6;  // Montpellier stores scaled down

      content += `${sample} ${step.step} ${intensity} ${dir.dec} ${dir.inc} ${coreAzimuth} ${coreDip} ${beddingStrike} ${beddingDip}\n`;
    });
  });

  // Create a blob and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.montpellier";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_GTK() {
  console.log("Export GTK function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, lithology, latitude, longitude, coreAzimuth, coreDip,
            beddingStrike, beddingDip, volume, steps } = specimen;

    // === HEADER ===
    content += "Sample file in GTK format\n";  // line 0 (placeholder title)
    content += `Sample name: ${sample}\n`;     // line 1
    content += `Lithology: ${lithology || "Unknown"}\n`; // line 2
    content += "\n\n\n";                       // lines 3-5 padding
    content += "\n";                           // line 6 padding
    
    // metadata line (line 7)
    // note: importGTK computed coreAzimuth/coreDip differently
    // reverse the transform here:
    let gtkCoreAzimuth = (coreAzimuth - 270 + 360) % 360;
    let gtkCoreDip = 90 - coreDip;
    let mass = 0; // unknown unless you tracked it in specimens

    content += `META ${latitude} ${longitude} ${gtkCoreAzimuth} ${gtkCoreDip} ${beddingStrike} ${beddingDip} ${volume} ${mass}\n`;

    // demagnetization line (line 8)
    let demag = specimen.demagnetizationType === "alternating" ? "AF" : "TH";
    content += demag + " demagnetization data\n";

    // === DATA LINES ===
    steps.forEach(step => {
      // recover dec/inc from coordinates (after rotation)
      let dir = step.coordinates.rotateTo(coreAzimuth, coreDip).toVector(Direction);

      // scale back to nA·m
      let x = -step.coordinates.x / 1E3;
      let y = step.coordinates.y / 1E3;
      let z = step.coordinates.z / 1E3;

      let intensity = step.coordinates.length() / 1E3;

      // fixed-width formatting like original GTK
      let line =
        step.step.toString().padEnd(4) +
        dir.dec.toFixed(1).toString().padStart(6) +
        dir.inc.toFixed(1).toString().padStart(7) +
        intensity.toFixed(2).toString().padStart(12) +
        y.toFixed(2).toString().padStart(8) +
        x.toFixed(2).toString().padStart(8) +
        z.toFixed(2).toString().padStart(8);

      content += line + "\n";
    });

    content += "\n"; // end specimen block
  });

  // Save as .gtk file
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.gtk";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_UNESP() {
  console.log("Export UNESP function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  // First line: demagnetization type
  // (Assume all specimens share same type — otherwise pick first)
  const demagType = specimens[0].demagnetizationType === "alternating" ? "AF Z" : "TH";
  content += "Specimen\t" + demagType + "\n";

  specimens.forEach(function(specimen) {
    const { sample, volume, coreAzimuth, coreDip, beddingStrike, beddingDip, steps } = specimen;

    steps.forEach(function(step) {
      // Convert back cartesian by dividing by 1E9
      const x = step.x / 1e9;
      const y = step.y / 1e9;
      const z = step.z / 1e9;

      // Declination & inclination (calculate from coords)
      const dir = new Direction(new Coordinates(x, y, z));

      // Geographic direction: rotate cartesian to geographic coords
      const gDir = new Coordinates(x, y, z).rotateTo(coreAzimuth, coreDip).toVector(Direction);

      // Build tab-separated line
      let line = [
        sample,               // [0] sample name
        step.step,            // [1] step
        x, y, z,              // [2-4] cartesian components
        coreAzimuth,          // [5]
        coreDip,              // [6]
        beddingStrike,        // [7]
        beddingDip,           // [8]
        dir.dec,              // [9]
        dir.inc,              // [10]
        "", "", "", "", "", "", "", "",  // fill unused [11-18]
        gDir.dec,             // [19]
        gDir.inc,             // [20]
        "", "", "", "", "", "", "", "", "", "", "", "", // [21-32]
        volume                // [33]
      ];

      content += line.join("\t") + "\n";
    });
  });

  // Export file
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.unesp.txt";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_SPINNER() {
  console.log("Export Spinner function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  let content = "";

  specimens.forEach(function(specimen) {
    const { sample, steps } = specimen;

    // Specimen header (just the sample name on its own line)
    content += `${sample}\n`;

    steps.forEach(function(step) {
      // Reverse scaling back to original format
      const x = step.x / 1e6;
      const y = step.y / 1e6;
      const z = step.z / 1e6;

      // Rebuild line. Original import read from parameters[2..5],
      // so we’ll put two leading commas before step.
      content += `,,${step.step},${x},${y},${z}\n`;
    });
  });

  // Create and download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.spinner";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convert_APPLICATIONSAVEOLD() {
  console.log("Export ApplicationSaveOld function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  const exportArray = specimens.map(function(specimen) {
    // Convert steps back to old format
    const data = specimen.steps.map(function(step) {
      return {
        step: step.step,
        x: step.coordinates.x,
        y: step.coordinates.y,
        z: step.coordinates.z,
        a95: step.error || 0
      };
    });

    // Convert interpretations
    const GEO = specimen.interpretations.map(function(interp) {
      let type;
      if (interp.type === "TAU1") {
        type = "dir";
      } else if (interp.type === "TAU3") {
        type = "gc";
      } else {
        type = interp.type.toLowerCase();
      }

      return {
        steps: interp.steps.map(s => s.step),
        type: type,
        forced: interp.anchored || false
      };
    });

    return {
      patch: 1.1,
      name: specimen.sample,
      volume: specimen.volume,
      bedStrike: specimen.beddingStrike,
      bedDip: specimen.beddingDip,
      coreAzi: specimen.coreAzimuth,
      coreDip: specimen.coreDip,
      declinationCorrection: 0, // can’t reconstruct reliably
      data: data,
      GEO: GEO,
      exported: specimen.created
    };
  });

  // Stringify nicely
  const content = JSON.stringify(exportArray, null, 2);

  // Create a blob and download
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted_specimens.json";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function convert_APPLICATIONSAVE() {
  console.log("Export Application Save function called.");

  if (specimens.length === 0) {
    alert("No specimens to export.");
    return;
  }

  // JSON string we'll hash
  const specimensJson = JSON.stringify(specimens);
  // compute hash (sha256Hex returns a Promise)
  const hash = await sha256Hex(specimensJson);
  const version = __VERSION__;
  const created = new Date().toISOString();

  // Construct save object
  const saveObject = {
    hash: hash,
    specimens: specimens,
	version,
	created
  };

  // Serialize to JSON (pretty-printed)
  const content = JSON.stringify(saveObject, null, 2);

  // Create a blob and download
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "application_save.json";
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



console.log("converting done")