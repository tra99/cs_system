import {
  BLANK,
  EN_CONTRACT_FONT,
  KH_CONTRACT_FONT,
  formatDateEn,
  formatDateKh,
  formatKhr,
  orBlank,
  toKhmerNumerals,
} from "./contract";
import { InternshipProfile, getInternshipTotal, splitBullets } from "./internship";

const CELL = "border border-black px-2 py-1";

export function EnglishInternshipDocument({ profile }: { profile: InternshipProfile }) {
  const advisorName = orBlank(profile.advisorNameEn);
  const total = formatKhr(getInternshipTotal(profile));

  return (
    <article className="text-[15px] leading-relaxed text-black" style={{ fontFamily: EN_CONTRACT_FONT }}>
      <h1 className="mb-8 text-center text-xl font-bold uppercase">Employment Agreement</h1>

      <p>
        Employment Agreement, between <strong>Cambodia Academy of Digital Technology</strong> (The
        <strong> “CADT”</strong>) and <strong>{advisorName}</strong> (The “Advisor”). This agreement
        may be executed in hand or electronically. By signing or typing his/her name on the signature
        line, each of the parties indicates agreement. This contract is subject to the employee rules
        of The <strong>CADT</strong> attached hereto.
      </p>

      <p className="mt-5">The CADT employs the Advisor on the following terms and conditions:</p>

      <ol className="mt-2 list-decimal space-y-2 pl-7">
        <li>
          <strong>Terms of Employment:</strong> Subject to the provisions for termination set forth
          below this agreement will begin on <strong>{formatDateEn(profile.startDate)}</strong> until
          the student successfully completes the internship program.
        </li>
        <li>
          <strong>Salary:</strong> The <strong>CADT</strong> shall pay the Advisor a one-time payment of
          <strong> {total} KHR</strong> after the completion of the student’s internship program upon
          obtaining a successful result.
        </li>
        <li>
          <strong>Duties and Position:</strong> The <strong>CADT</strong> hires the Advisor to advise
          students in{" "}
          <strong>
            Term {profile.term} ({orBlank(profile.internshipEn)}),
          </strong>{" "}
          <strong>{orBlank(profile.departmentEn)}</strong>, Generation <strong>{profile.generation}</strong>.
        </li>
      </ol>

      <p className="mt-4 pl-7">3.1 The Advisor will advise the student(s) as the following list:</p>
      <table className="contract-duty-table my-3 w-full border-collapse text-[14px] leading-snug">
        <thead>
          <tr>
            <th className={`${CELL} w-12`}>No.</th>
            <th className={CELL}>Student’s name</th>
            <th className={CELL}>Project/Topic</th>
            <th className={CELL}>Company’s name</th>
          </tr>
        </thead>
        <tbody>
          {profile.students.map((student, index) => (
            <tr key={student.id}>
              <td className={`${CELL} text-center`}>{index + 1}</td>
              <td className={CELL}>{student.nameEn || BLANK}</td>
              <td className={CELL}>{student.project}</td>
              <td className={CELL}>{student.company}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 pl-7">3.2. The Advisor accepts the following duties:</p>
      <table className="contract-duty-table my-3 w-full border-collapse text-[14px] leading-snug">
        <thead>
          <tr>
            <th className={`${CELL} w-12`}>No.</th>
            <th className={CELL}>Main Tasks</th>
            <th className={`${CELL} w-32`}>Hours per student</th>
            <th className={`${CELL} w-32`}>Number of Students</th>
          </tr>
        </thead>
        <tbody>
          {profile.duties.map((duty, index) => (
            <tr key={duty.id}>
              <td className={`${CELL} text-center`}>{index + 1}</td>
              <td className={CELL}>
                {duty.titleEn || BLANK}
                <DutyBullets bullets={splitBullets(duty.bulletsEn)} />
              </td>
              <td className={`${CELL} text-center`}>{duty.hoursPerStudent}</td>
              <td className={`${CELL} text-center`}>{profile.students.length}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} className={`${CELL} py-2 text-center font-bold`}>
              Total Payment
            </td>
            <td colSpan={2} className={`${CELL} py-2 text-center font-bold`}>
              {total} KHR
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-3">
        The Advisor’s duties may be reasonably modified at the <strong>CADT</strong>’s discretion from
        time to time.
      </p>

      <ol className="mt-3 list-decimal space-y-2 pl-7" start={4}>
        <li>
          <strong>Confidentiality of Proprietary Information:</strong> Advisor agrees, during or after
          the term of this employment, not to reveal non-public information such as school business
          strategy, project details, company data, student names, client names, contacts, marketing
          activities, or financial data including to any person or entity directly or indirectly.
        </li>
        <li>
          <strong>Termination of Agreement:</strong> The <strong>CADT</strong> may terminate this
          agreement at any time without any payment if the Advisor doesn’t fulfill the duties mentioned
          above and doesn’t provide convenient channels of communication with student.
        </li>
        <li>
          <strong>Severability:</strong> If for any reason, any provision of this agreement is held
          invalid, all other provisions of this agreement shall remain in effect.
        </li>
        <li>
          <strong>Governing Law and Dispute Resolution:</strong> This Agreement shall be governed by
          and construed according to the laws of Cambodia. Any dispute arising out of this Agreement
          shall be settled by Cambodia authorities and/or courts if no amicable settlement can be
          reached. In the event that any matter arises which is not covered by this Agreement, the
          Parties shall follow the laws and best practices in Cambodia to deal with such matters.
        </li>
      </ol>

      <p className="mt-8">
        <strong>IN WITNESS WHEREOF</strong>, the Parties have hereupon executed this Agreement on the
        date first written above, in two (2) original copies in the English language and two (2)
        original copies in the Khmer language, one of which shall be kept by each Party.
      </p>

      <div className="contract-signature-block mt-16 grid grid-cols-2 gap-12 text-[14px]">
        <div>
          <div className="mb-2 border-b border-black pb-8" />
          <p>On behalf of CADT</p>
          <p>Date: ............................</p>
        </div>
        <div>
          <div className="mb-2 border-b border-black pb-8" />
          <p className="font-bold">{advisorName}</p>
          <p>Date: ............................</p>
        </div>
      </div>
    </article>
  );
}

export function KhmerInternshipDocument({ profile }: { profile: InternshipProfile }) {
  // Khmer fields fall back to the English value when left empty
  const advisorName = orBlank(profile.advisorNameKh || profile.advisorNameEn);
  const internship = orBlank(profile.internshipKh || profile.internshipEn);
  const department = orBlank(profile.departmentKh || profile.departmentEn);
  const total = toKhmerNumerals(formatKhr(getInternshipTotal(profile)));

  return (
    <article className="text-[14px] leading-[1.9] text-black" style={{ fontFamily: KH_CONTRACT_FONT }}>
      <h1 className="mb-7 text-center text-[22px] font-bold">កិច្ចសន្យាការងារ</h1>

      <p>
        កិច្ចសន្យាការងាររវាងបណ្ឌិត្យសភាបច្ចេកវិទ្យាឌីជីថលកម្ពុជា (<strong>ប.ប.ឌ</strong>) និង
        <strong> {advisorName}</strong> (គ្រូដឹកនាំ)។ កិច្ចសន្យានេះ
        អាចអនុវត្តន៍បានតាមរយៈដោយផ្ទាល់ ឬតាមប្រព័ន្ធអេឡិចត្រូនិច។ កិច្ចសន្យានេះ
        នឹងមានសុពលភាពបន្ទាប់ការចុះហត្ថលេខា ឬសរសេរឈ្មោះគ្រូដឹកនាំនៅកន្លែងចុះហត្ថលេខា។
        កិច្ចសន្យានេះត្រូវកំណត់ឲ្យស្របទៅតាមច្បាប់ការងាររបស់ <strong>ប.ប.ឌ</strong>{" "}
        ដែលបានភ្ជាប់ខាងក្រោមនេះ។
      </p>

      <p className="mt-4">
        <strong>ប.ប.ឌ</strong> តម្រូវឲ្យគ្រូដឹកនាំអនុវត្តទៅតាមខចែង និងលក្ខខណ្ឌដូចខាងក្រោមនេះ៖
      </p>

      <div className="mt-2 space-y-2">
        <p>
          <strong>១. ខចែងនៃការងារ៖</strong> តម្រូវឲ្យផ្តល់នូវសេវាមួយចប់កម្មវិធីដែលមានចែងក្នុងកិច្ចសន្យាខាងក្រោម
          ហើយកិច្ចសន្យានឹងត្រូវចាប់ផ្តើមពី<strong>{formatDateKh(profile.startDate)}</strong>{" "}
          រហូតដល់និស្សិតការពារសម្មិទ្ធផលកម្មសិក្សាប្រកបដោយជោគជ័យ។
        </p>
        <p>
          <strong>២. ប្រាក់លើកទឹកចិត្ត៖</strong> <strong>ប.ប.ឌ</strong>{" "}
          នឹងផ្តល់ជូនគ្រូដឹកនាំនូវប្រាក់ឧបត្ថម្ភចំនួន <strong>{total} រៀល</strong>{" "}
          បន្ទាប់ពីលទ្ធផលកម្មសិក្សារបស់និស្សិតត្រូវបានប្រកាស និងទទួលបានជោគជ័យ។
        </p>
        <p>
          <strong>៣. ភារកិច្ច និងតួនាទី៖</strong> <strong>ប.ប.ឌ</strong> តម្រូវឲ្យដឹកនាំនិស្សិតកម្មសិក្សានៅក្នុង{" "}
          <strong>
            វគ្គសិក្សាទី{toKhmerNumerals(profile.term)} ({internship})
          </strong>{" "}
          នៃ<strong>{department}</strong> ជំនាន់ទី{toKhmerNumerals(profile.generation)}។
        </p>
      </div>

      <p className="mt-4 pl-7">៣.១ បញ្ជីរាយនាមឈ្មោះនិស្សិត៖</p>
      <table className="contract-duty-table my-3 w-full border-collapse text-[13px] leading-[1.6]">
        <thead>
          <tr>
            <th className={`${CELL} w-12`}>ល.រ</th>
            <th className={CELL}>ឈ្មោះនិស្សិត</th>
            <th className={CELL}>ប្រធានបទ</th>
            <th className={CELL}>ឈ្មោះក្រុមហ៊ុន</th>
          </tr>
        </thead>
        <tbody>
          {profile.students.map((student, index) => (
            <tr key={student.id}>
              <td className={`${CELL} text-center`}>{toKhmerNumerals(index + 1)}</td>
              <td className={CELL}>{student.nameKh || student.nameEn || BLANK}</td>
              <td className={CELL} style={{ fontFamily: EN_CONTRACT_FONT }}>
                {student.project}
              </td>
              <td className={CELL} style={{ fontFamily: EN_CONTRACT_FONT }}>
                {student.company}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4">៣.២ គ្រូដឹកនាំត្រូវទទួលភារកិច្ចដូចខាងក្រោមនេះ៖</p>
      <table className="contract-duty-table my-3 w-full border-collapse text-[13px] leading-[1.6]">
        <thead>
          <tr>
            <th className={`${CELL} w-12`}>ល.រ</th>
            <th className={CELL}>ការងារគោល</th>
            <th className={`${CELL} w-32`}>ចំនួនម៉ោងសម្រាប់និស្សិតម្នាក់</th>
            <th className={`${CELL} w-28`}>ចំនួននិស្សិត</th>
          </tr>
        </thead>
        <tbody>
          {profile.duties.map((duty, index) => (
            <tr key={duty.id}>
              <td className={`${CELL} text-center`}>{toKhmerNumerals(index + 1)}</td>
              <td className={CELL}>
                {duty.titleKh || duty.titleEn || BLANK}
                <DutyBullets bullets={splitBullets(duty.bulletsKh || duty.bulletsEn)} dash />
              </td>
              <td className={`${CELL} text-center`}>{toKhmerNumerals(duty.hoursPerStudent)}</td>
              <td className={`${CELL} text-center`}>{toKhmerNumerals(profile.students.length)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} className={`${CELL} py-2 text-center font-bold`}>
              ប្រាក់លើកទឹកចិត្តសរុប
            </td>
            <td colSpan={2} className={`${CELL} py-2 text-center font-bold`}>
              {total} រៀល
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        <strong>ប.ប.ឌ</strong> រក្សាសិទ្ធក្នុងការកែប្រែភារកិច្ចរបស់គ្រូដឹកនាំគ្រប់ពេលវេលា។
      </p>

      <div className="mt-4 space-y-2">
        <p>
          <strong>៤. ការសម្ងាត់នៃកម្មសិទ្ធិព័ត៌មាន៖</strong> គ្រូដឹកនាំយល់ព្រមថានៅក្នុងកំឡុងពេល
          និងក្រោយបញ្ចប់ការងារនេះ មិនត្រូវលាតត្រដាងនូវព័ត៌មានជាសាធារណៈដូចជា
          យុទ្ធសាស្ត្រជំនួញរបស់សាលា ព័ត៌មានគម្រោង ព័ត៌មានក្រុមហ៊ុន ឈ្មោះនិស្សិត ឈ្មោះអតិថិជន
          ព័ត៌មានទំនាក់ទំនង សកម្មភាពទីផ្សារ ឬទិន្នន័យហិរញ្ញវត្ថុរួមទាំង បុគ្គល
          ឬនីតិបុគ្គលដោយផ្ទាល់ ឬប្រយោល។
        </p>
        <p>
          <strong>៥. ការបញ្ចប់នៃកិច្ចសន្យា៖</strong> <strong>ប.ប.ឌ</strong>{" "}
          អាចបញ្ចប់កិច្ចសន្យានេះបានគ្រប់ពេល ដោយគ្មានការផ្តល់ជូននូវប្រាក់លើកទឹកចិត្ត
          ប្រសិនបើគ្រូដឹកនាំមិនបានបំពេញភារកិច្ចការងារដែលបានចែងខាងលើ
          និងមិនបានផ្តល់នូវមធ្យោបាយក្នុងការទំនាក់ទំនងជាមួយនិស្សិត។
        </p>
        <p>
          <strong>៦. ទុព្វលភាព៖</strong> ប្រសិនបើមានករណីណាមួយ
          នៃការផ្តល់ជូនក្នុងកិច្ចសន្យាប្រព្រឹត្តទៅមិនសមស្រប នោះការផ្គត់ផ្គង់ដទៃទៀតក្នុងកិច្ចសន្យា
          នឹងនៅតែមានប្រសិទ្ធភាព។
        </p>
        <p>
          <strong>៧. ច្បាប់គ្រប់គ្រងរដ្ឋបាល និងដំណោះស្រាយជំលោះ៖</strong> កិច្ចសន្យានេះត្រូវគ្រប់គ្រង
          និងបកស្រាយដោយច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។ រាល់ជំលោះដែលកើតមានឡើងក្រៅពីកិច្ចសន្យានេះ
          នឹងត្រូវដោះស្រាយដោយអាជ្ញាធរកម្ពុជា ឬតុលាការក្នុងករណីបើមិនមានការសម្របសម្រួលដោយសន្តិវិធី។
          ប្រសិនបើមានព្រឹត្តិការណ៍ ឬបញ្ហាណាដែលកើតឡើងមិនស្ថិតក្នុងកិច្ចសន្យានេះ
          ភាគីទាំងពីរត្រូវគោរពទៅតាមច្បាប់ជាធរមានរបស់ព្រះរាជាណាចក្រកម្ពុជា ចំពោះបញ្ហានោះ។
        </p>
      </div>

      <p className="mt-8">
        ដើម្បីជាភស្តុតាង ភាគីទាំងពីរចាប់ផ្តើមប្រតិបត្តិនូវកិច្ចសន្យានេះចាប់ពីថ្ងៃដំបូងដែលបានចុះខាងលើ
        ហើយកិច្ចសន្យានេះនឹងធ្វើចំនួន០២ច្បាប់ដើមជាភាសាអង់គ្លេស និងភាសាខ្មែរចំនួន០២ច្បាប់ដើម
        ដោយភាគីនីមួយៗរក្សាទុក០១ច្បាប់រៀងៗខ្លួន។
      </p>

      <div className="contract-signature-block mt-12 grid grid-cols-2 gap-12 text-center text-[13px]">
        <div>
          <p>ធ្វើនៅរាជធានីភ្នំពេញ</p>
          <p>ថ្ងៃទី ........ ខែ ........ ឆ្នាំ ........</p>
          <div className="mb-2 pb-16" />
          <p className="font-bold">ភាគីតំណាងបណ្ឌិត្យសភា</p>
        </div>
        <div>
          <p>ធ្វើនៅរាជធានីភ្នំពេញ</p>
          <p>ថ្ងៃទី ........ ខែ ........ ឆ្នាំ ........</p>
          <div className="mb-2 pb-16" />
          <p className="font-bold">{advisorName}</p>
        </div>
      </div>
    </article>
  );
}

function DutyBullets({ bullets, dash = false }: { bullets: string[]; dash?: boolean }) {
  if (bullets.length === 0) return null;
  return (
    <ul className={`mt-1 space-y-0.5 pl-6 ${dash ? "list-['-_']" : "list-disc"}`}>
      {bullets.map((bullet, index) => (
        <li key={index}>{bullet}</li>
      ))}
    </ul>
  );
}
