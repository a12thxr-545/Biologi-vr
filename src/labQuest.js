import { sound } from './audio.js';

export class LabQuestManager {
  constructor() {
    this.tasks = [
      { id: 'slide', title: 'วางสไลด์ตัวอย่างบนแท่นวางวัตถุ', desc: 'คลิกเลือกสไลด์ (เยื่อหอม / เยื่อบุแก้ม / เลือด / พารามีเซียม)', done: false },
      { id: 'stain', title: 'หยดสารย้อมสีเซลล์ (Staining)', desc: 'คลิกขวดไอโอดีน (Iodine) หรือ เมทิลีนบลู (Methylene Blue)', done: false },
      { id: 'light', title: 'เปิดสวิตช์ไฟกล้องจุลทรรศน์', desc: 'คลิกสวิตช์ไฟที่ฐานกล้อง (Illuminator Power)', done: false },
      { id: 'eyepiece', title: 'ก้มเอาดวงตาส่องที่เลนส์ใกล้ตา', desc: 'คลิกที่เลนส์ใกล้ตาเพื่อมองทะลุผ่านเลนส์เสมือนจริง', done: false },
      { id: 'focus', title: 'หมุนปุ่มปรับโฟกัสจนภาพคมชัด', desc: 'ปรับปุ่มโฟกัสหยาบ/ละเอียดจนขึ้นแถบสีเขียว (In Focus)', done: false },
      { id: 'magnify', title: 'ปรับกำลังขยายเลนส์เป็น 40x หรือ 100x', desc: 'หมุนแป้นเลนส์ใกล้วัตถุเพื่อดูลึกระดับนิวเคลียส', done: false },
      { id: 'record', title: 'บันทึกภาพผลการทดลองลงสมุดแล็บ', desc: 'กดปุ่มบันทึกภาพผลแล็บเพื่อสรุปรายงานชีววิทยา', done: false }
    ];
    this.completedCount = 0;
    this.onUpdateCallback = null;
  }

  completeTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && !task.done) {
      task.done = true;
      this.completedCount = this.tasks.filter(t => t.done).length;
      sound.playAtpSparkle();

      if (this.onUpdateCallback) {
        this.onUpdateCallback(this);
      }
    }
  }

  isAllCompleted() {
    return this.completedCount === this.tasks.length;
  }
}

export const labQuest = new LabQuestManager();
