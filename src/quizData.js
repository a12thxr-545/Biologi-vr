export const BIOLOGY_DATA = {
  specimens: {
    onion: {
      id: 'onion',
      nameTh: 'เซลล์เยื่อหอม (Plant - Allium Cepa)',
      nameEn: 'Onion Epidermal Cells',
      descriptionTh: 'เซลล์พืชชั้นนอก มีรูปทรงหลายเหลี่ยมเรียงต่อกันเป็นระเบียบชัดเจน ประกอบด้วยผนังเซลล์ (Cell Wall) ทำจากเซลลูโลส ไซโทพลาซึม และแวคิวโอลขนาดใหญ่ (Central Vacuole) ที่ดันนิวเคลียสไปชิดขอบเซลล์',
      keyFeatures: [
        'ผนังเซลล์ (Cell Wall) คมชัดช่วยคงรูปทรง',
        'ย้อมด้วยสารละลายไอโอดีน (Iodine) นิวเคลียสติดสีน้ำตาลอมเหลือง',
        'ไม่มีคลอโรพลาสต์เนื่องจากเป็นส่วนหัวหอมที่เจริญอยู่ใต้ดิน'
      ],
      defaultStain: 'none',
      stainEffects: {
        none: { tint: '#e2f0d9', nucleusVisibility: 0.25, contrast: 0.6 },
        iodine: { tint: '#fde9b5', nucleusVisibility: 0.95, contrast: 1.2 },
        methyleneBlue: { tint: '#d4ebf9', nucleusVisibility: 0.9, contrast: 1.1 }
      }
    },
    cheek: {
      id: 'cheek',
      nameTh: 'เซลล์เยื่อบุข้างแก้ม (Human Cheek Cell)',
      nameEn: 'Stratified Squamous Epithelial Cell',
      descriptionTh: 'เซลล์สัตว์ชนิดเยื่อบุผิว รูปร่างแบนค่อนข้างกลม ไม่แน่นอน ไม่มีผนังเซลล์ ขอบเซลล์อาจพับงอ มีนิวเคลียสทรงกลมเด่นชัดอยู่เกือบกึ่งกลางเซลล์',
      keyFeatures: [
        'เยื่อหุ้มเซลล์ (Cell Membrane) ยืดหยุ่น ไม่มีผนังเซลล์',
        'ย้อมด้วยเมทิลีนบลู (Methylene Blue) จะเห็นนิวเคลียสติดสีน้ำเงินเข้มชัดเจนมาก',
        'เป็นเซลล์ยูคาริโอตของมนุษย์ที่หลุดลอกออกมาได้ง่าย'
      ],
      defaultStain: 'none',
      stainEffects: {
        none: { tint: '#f5f5f5', nucleusVisibility: 0.2, contrast: 0.5 },
        iodine: { tint: '#faebd7', nucleusVisibility: 0.7, contrast: 0.9 },
        methyleneBlue: { tint: '#cce5ff', nucleusVisibility: 0.98, contrast: 1.3 }
      }
    },
    blood: {
      id: 'blood',
      nameTh: 'สเมียร์เลือดมนุษย์ (Human Blood Smear)',
      nameEn: 'Human Blood Cells (RBC & WBC)',
      descriptionTh: 'ประกอบด้วยเม็ดเลือดแดง (Erythrocytes) รูปจานเว้าตรงกลางสองด้าน (Biconcave disc) ไม่มีนิวเคลียสในระยะโตเต็มวัย และเซลล์เม็ดเลือดขาว (Leukocytes) เช่น Neutrophil ที่มีนิวเคลียสหลายพู (Multilobed)',
      keyFeatures: [
        'เม็ดเลือดแดง (RBC) มีฮีโมโกลบิน ลำเลียงออกซิเจน รอยบุ๋มกลางเซลล์รับแสงโปร่งแสง',
        'เม็ดเลือดขาว (WBC) มีนิวเคลียส ทำหน้าที่ในระบบภูมิคุ้มกัน',
        'เกล็ดเลือด (Platelets) เป็นเศษชิ้นส่วนช่วยในการแข็งตัวของเลือด'
      ],
      defaultStain: 'methyleneBlue',
      stainEffects: {
        none: { tint: '#ffebee', nucleusVisibility: 0.3, contrast: 0.7 },
        iodine: { tint: '#fff3e0', nucleusVisibility: 0.6, contrast: 0.9 },
        methyleneBlue: { tint: '#fce4ec', nucleusVisibility: 0.95, contrast: 1.25 }
      }
    },
    paramecium: {
      id: 'paramecium',
      nameTh: 'พารามีเซียม (Paramecium caudatum)',
      nameEn: 'Living Protozoan Microorganism',
      descriptionTh: 'สิ่งมีชีวิตเซลล์เดียวกลุ่มโพรโทซัว รูปคล้ายรองเท้าแตะ ขอบเซลล์มีซิเลีย (Cilia) โบกพัดเพื่อเคลื่อนที่ มีคอนแทร็กไทล์แวคิวโอล (Contractile Vacuole) ควบคุมดุลยภาพน้ำ',
      keyFeatures: [
        'Cilia รอบตัวช่วยในการเคลื่อนที่และพัดอาหารเข้าสู่ Oral groove',
        'มี 2 นิวเคลียส: Macronucleus และ Micronucleus',
        'Contractile vacuole บีบขยายเพื่อขับน้ำส่วนเกินออกจากเซลล์'
      ],
      defaultStain: 'none',
      stainEffects: {
        none: { tint: '#e8f5e9', nucleusVisibility: 0.5, contrast: 0.8 },
        iodine: { tint: '#fff8e1', nucleusVisibility: 0.85, contrast: 1.1 },
        methyleneBlue: { tint: '#e1f5fe', nucleusVisibility: 0.9, contrast: 1.2 }
      }
    }
  },

  tonicity: {
    hypotonic: {
      id: 'hypotonic',
      titleTh: 'สารละลายไฮโพโทนิก (Hypotonic Solution)',
      titleEn: 'Low Solute / Pure Water',
      osmolarity: 'น้อยกว่าภายในเซลล์ (< 300 mOsm/L หรือ น้ำกลั่น)',
      waterFlow: 'น้ำออสโมซิสไหล "เข้า" สู่เซลล์อย่างรวดเร็ว',
      animalCell: {
        status: 'เซลล์แตก (Lysis / Hemolysis)',
        desc: 'เนื่องจากเซลล์สัตว์ไม่มีผนังเซลล์ แรงดันน้ำภายในจึงทำให้เยื่อหุ้มเซลล์แตกออก',
        scale: 1.45,
        burst: true
      },
      plantCell: {
        status: 'เซลล์เต่ง (Turgid)',
        desc: 'น้ำเข้าเซลล์ทำให้แวคิวโอลขยายใหญ่ เกิดแรงดันเต่ง (Turgor pressure) สูง แต่เซลล์ไม่แตกเพราะมีผนังเซลล์แข็งแกร่งค้ำจุน',
        scale: 1.1,
        burst: false
      }
    },
    isotonic: {
      id: 'isotonic',
      titleTh: 'สารละลายไอโซโทนิก (Isotonic Solution)',
      titleEn: 'Equal Solute / 0.9% NaCl Saline',
      osmolarity: 'เท่ากับภายในเซลล์ (~ 300 mOsm/L)',
      waterFlow: 'อัตราน้ำเข้าและออกจากเซลล์เท่ากัน (Dynamic Equilibrium)',
      animalCell: {
        status: 'เซลล์ปกติ (Normal / Biconcave)',
        desc: 'เซลล์รักษาสภาพและปริมาตรปกติ เหมาะสมต่อการทำงานของสรีรวิทยา',
        scale: 1.0,
        burst: false
      },
      plantCell: {
        status: 'เซลล์คงรูปปกติ (Flaccid)',
        desc: 'ไม่มีแรงดันเต่งมากระทำต่อผนังเซลล์เป็นพิเศษ พืชอาจไม่แข็งแรงเท่าภาวะเต่ง',
        scale: 1.0,
        burst: false
      }
    },
    hypertonic: {
      id: 'hypertonic',
      titleTh: 'สารละลายไฮเพอร์โทนิก (Hypertonic Solution)',
      titleEn: 'High Solute / 10% Concentrated Salt',
      osmolarity: 'มากกว่าภายในเซลล์ (> 300 mOsm/L)',
      waterFlow: 'น้ำออสโมซิสไหล "ออก" จากเซลล์',
      animalCell: {
        status: 'เซลล์เหี่ยว (Crenation / Shriveled)',
        desc: 'น้ำสูญเสียออกนอกเซลล์ ทำให้เซลล์หดตัวและผิวเซลล์หยักย่น',
        scale: 0.72,
        burst: false
      },
      plantCell: {
        status: 'พลาสโมไลซิส (Plasmolysis)',
        desc: 'ไซโทพลาซึมและเยื่อหุ้มเซลล์หดตัวแยกออกจากผนังเซลล์ พืชเหี่ยวเฉา',
        scale: 0.75,
        burst: false
      }
    }
  },

  organelles: {
    mitochondria: {
      nameTh: 'ไมโทคอนเดรีย (Mitochondria)',
      nameEn: 'Powerhouse of the Cell',
      roleTh: 'สร้างพลังงาน ATP ผ่านกระบวนการหายใจระดับเซลล์ (Cellular Respiration) มีเยื่อหุ้ม 2 ชั้น และมี DNA ของตัวเอง',
      activity: 'เติมกลูโคสและออกซิเจนเพื่อกระตุ้น ATP Synthase ให้สร้าง ATP เรืองแสง'
    },
    nucleus: {
      nameTh: 'นิวเคลียส & รหัสพันธุกรรม (Nucleus & DNA)',
      nameEn: 'Genetic Control Center',
      roleTh: 'ศูนย์กลางควบคุมการทำงานและการถ่ายทอดลักษณะทางพันธุกรรม บรรจุโครมาทิน และดีเอ็นเอสายเกลียวคู่ (DNA Double Helix)',
      activity: 'เปิดเปลือกเยื่อหุ้มนิวเคลียสเพื่อสำรวจสาย DNA และการจับคู่ของเบส A-T, C-G'
    },
    chloroplast: {
      nameTh: 'คลอโรพลาสต์ (Chloroplast)',
      nameEn: 'Photosynthetic Organelle',
      roleTh: 'พบเฉพาะในเซลล์พืชและสาหร่าย ภายในมีไทลาคอยด์ (Thylakoids) ซ้อนกันเป็นกรานัม มีคลอโรฟิลล์ดักจับพลังงานแสงเพื่อสังเคราะห์ด้วยแสง',
      activity: 'เพิ่มความเข้มแสงแดดเพื่อสังเกตการปล่อยออกซิเจนและน้ำตาล'
    },
    golgi: {
      nameTh: 'กอลจิคอมเพล็กซ์ (Golgi Apparatus)',
      nameEn: 'Packaging & Secretion Center',
      roleTh: 'ปรับแต่ง เติมแต่งคาร์โบไฮเดรต บรรจุโปรตีนใส่ถุงเวสิเคิล (Vesicles) ส่งออกนอกเซลล์',
      activity: 'สังเกตการส่งผ่านถุง Vesicle เคลื่อนที่ไปตามรางไมโครทูบูล'
    }
  },

  quiz: [
    {
      question: 'เมื่อนำเซลล์เยื่อหอมแช่ในน้ำกลั่น (Hypotonic Solution) จะเกิดอะไรขึ้น?',
      options: [
        'เซลล์เต่งและขยายตัว แต่ไม่แตกเพราะมีผนังเซลล์',
        'เซลล์บวมและแตกออกเหมือนเซลล์เม็ดเลือดแดง',
        'เซลล์เหี่ยวเนื่องจากน้ำออสโมซิสออกจากเซลล์',
        'เซลล์ไม่มีการเปลี่ยนแปลงใดๆ ทั้งสิ้น'
      ],
      correctIndex: 0,
      explanation: 'เซลล์พืชมีผนังเซลล์ (Cell wall) ที่แข็งแรงจากเซลลูโลส ทำให้สามารถทนแรงดันเต่ง (Turgor pressure) ได้โดยไม่แตก ต่างจากเซลล์สัตว์ที่ไม่มีผนังเซลล์'
    },
    {
      question: 'การย้อมเซลล์เยื่อบุข้างแก้มด้วยสารละลายเมทิลีนบลู (Methylene Blue) มีจุดประสงค์เพื่อสิ่งใด?',
      options: [
        'เพื่อฆ่าเชื้อแบคทีเรียทั้งหมดในสไลด์',
        'เพื่อให้เห็นนิวเคลียสและโครงสร้างเซลล์ติดสีน้ำเงินชัดเจน',
        'เพื่อทำให้เซลล์ขยายขนาดใหญ่ขึ้น 10 เท่า',
        'เพื่อเปลี่ยนเซลล์สัตว์ให้กลายเป็นเซลล์พืช'
      ],
      correctIndex: 1,
      explanation: 'เมทิลีนบลูเป็นสีย้อมที่มีประจุบวก จะจับกับสารพันธุกรรม (DNA/RNA) และโปรตีนที่มีประจุลบในนิวเคลียส ทำให้เห็นนิวเคลียสติดสีน้ำเงินเข้มตัดกับไซโทพลาซึม'
    },
    {
      question: 'ออร์แกเนลล์ใดทำหน้าที่เสมือนโรงงานผลิตพลังงาน ATP หลักของเซลล์?',
      options: [
        'ไรโบโซม (Ribosome)',
        'กอลจิบอดี (Golgi apparatus)',
        'ไมโทคอนเดรีย (Mitochondria)',
        'ไลโซโซม (Lysosome)'
      ],
      correctIndex: 2,
      explanation: 'ไมโทคอนเดรียมีเยื่อหุ้มชั้นในพับเป็น Cristae และมีเอนไซม์ ATP Synthase ทำหน้าที่สร้าง ATP ผ่านกระบวนการ oxidative phosphorylation'
    },
    {
      question: 'เมื่อเซลล์พืชอยู่ในสารละลายไฮเพอร์โทนิก (Hypertonic) จนเยื่อหุ้มเซลล์ร่นหดแยกออกจากผนังเซลล์ ปรากฏการณ์นี้เรียกว่าอะไร?',
      options: [
        'พลาสโมไลซิส (Plasmolysis)',
        'ฮีโมไลซิส (Hemolysis)',
        'ฟาโกไซโทซิส (Phagocytosis)',
        'ไซโทไคเนซิส (Cytokinesis)'
      ],
      correctIndex: 0,
      explanation: 'Plasmolysis คือปรากฏการณ์ที่น้ำออสโมซิสออกจากเซลล์พืชจนไซโทพลาซึมและเยื่อหุ้มเซลล์หดตัวแยกออกจากผนังเซลล์เนื่องจากความดันออสโมซิสภายนอกสูงกว่า'
    }
  ]
};
