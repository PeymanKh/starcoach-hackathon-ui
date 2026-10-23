import type { ReactNode } from "react";
import { maskIcon, type IconComponent } from "@/components/ui/mask-icon";
import { Callout, Point, Section, Term } from "@/components/ui/prose";
import agentIcon from "@/assets/icons/agent.png";
import designSystemIcon from "@/assets/icons/design-system.png";
import aboutIcon from "@/assets/icons/about.png";

/**
 * ✏️  EDIT ME DURING THE HACKATHON
 * The three sidebar buttons and their popups come from this file.
 * Change `label`, `title`, `eyebrow`, and `body` freely —
 * the sidebar and modal render whatever is here.
 *
 * Icons: transparent PNGs in src/assets/icons, used as tintable masks.
 * Any Lucide icon also works here (same `className` contract).
 */
const AgentIcon = maskIcon(agentIcon);
const DesignSystemIcon = maskIcon(designSystemIcon);
const AboutIcon = maskIcon(aboutIcon);

/** TODO: link to the data-prep notebook (used in the "agent architecture" popup) */
const DATA_NOTEBOOK_URL = "#";

export type HackathonCard = {
  id: string;
  /** Short text on the sidebar button */
  label: string;
  icon: IconComponent;
  /** Tiny line above the modal title (optional) */
  eyebrow?: string;
  /** Modal title */
  title: string;
  /** Modal body (JSX allowed) */
  body: ReactNode;
  /** "wide" for long docs; defaults to the narrower popup */
  size?: "default" | "wide";
};

export const hackathonCards: HackathonCard[] = [
  {
    id: "agent-architecture",
    label: "معماری ایجینت",
    icon: AgentIcon,
    title: "مستندات ساخت محصول، از شروع تا پایان",
    size: "wide",
    body: (
      <>
        <Section n="۱" title="آنالیز تربچه">
          <p>
            اولین کاری که برای طراحی این محصول انجام دادم، بررسی دقیق{" "}
            <Term>تربچه</Term> بود. برای اولین بار از آن استفاده کردم و سعی
            کردم گپ‌هایی که از نظر خودم در آن وجود داشت را رفع کنم.
          </p>
          <p>
            مهم‌ترین گپی که حس کردم دیزاین زیبا و مدرن بود که البته سلیقه‌ای
            هست؛ اما مهم‌تر این بود که تربچه بدون اینکه اطلاعات کافی در مورد
            خواسته‌ی کاربر بگیرد، فروشگاه‌ها را معرفی می‌کند. طبق چیزی که من
            متوجه شدم فروشنده‌ها بابت هر کلیک هزینه پرداخت می‌کنند و راستش
            به‌نظرم به‌راحتی با گرفتن اطلاعاتی مثل بودجه و معیارهای دیگه، میشه{" "}
            <strong>ارزش هر کلیک</strong> را بیشتر کرد.
          </p>
          <p>
            این پروژه در واقع ورژن تربچه‌ای هست که من طراحی کردم و سعی کردم
            در حد خودم بخش‌هایی که در توانم بود را بهبود ببخشم.
          </p>
        </Section>

        <Section n="۲" title="دیتا؛ قلب تپنده‌ی محصول">
          <p>
            طبق روال پروژه‌هایی که از دیتا در اون‌ها استفاده میشه، اولین کار
            این بود که سراغ دیتا برم و سعی کنم اول از همه اون رو بفهمم و بعد
            سعی کنم اون رو آماده‌ی استفاده کنم. بیشتر زمان من{" "}
            <strong>(حدود ۹ ساعت)</strong> در این بخش صرف شد.
          </p>

          <Point label="ساختار داده">
            اولین چیزی که بعد از باز کردن فایل متوجه شدم این بود که ساعات
            کاری، روش‌های پرداخت، دسته‌بندی‌ها، گارانتی و مشخصات فنی محصولات
            به‌صورت <code>JSON</code> ذخیره شده بود که برای استفاده نیاز به
            تغییر داشت.
          </Point>

          <Point label="یکدست‌سازی متن فارسی">
            یکی از پیچیدگی‌های زبان فارسی در پردازش متن، به‌نظر من مشترک بودن
            برخی کلمات با زبان عربی هست. با اینکه این پروژه از{" "}
            <code>tokenization</code> یا <code>embedding</code> استفاده
            نمی‌کند، اما طبق عادت این کار رو انجام دادم تا مطمئن بشم همه چیز
            تمیز پیش میره.
          </Point>

          <Point label="قیمت‌ها">
            عجیب‌ترین بخش دیتا مربوط به قیمت‌ها میشد. مبلغ گران‌ترین محصول رو
            حتی نمی‌تونستم بخونم و ارزان‌ترین محصول ۱ تومان بود. داستان طولانی
            رو خلاصه کنم؛ برای بهتر شدن عملکرد ایجینت:
          </Point>
          <ul>
            <li>
              قیمت‌های بالای ۱۰۰ میلیارد تومان رو به‌عنوان غیرواقعی در نظر
              گرفتم.
            </li>
            <li>
              چون ۲ فروشگاه تمام محصولات خود را با قیمت ۱ تومان وارد کرده
              بودند، فرض رو این گذاشتم که فروشگاه به دلیل نوسانات قیمت را وارد
              نکرده؛ پس قیمت باید مستقیم از خود فروشنده گرفته بشه.
            </li>
          </ul>

          <p>
            نکات بسیاری در بخش دیتا وجود داشت که برای خلاصه ماندن این متن،
            همین‌جا این بخش را تمام می‌کنم؛ اما پیشنهاد می‌کنم{" "}
            <code>notebook</code> مربوط رو در{" "}
            <a href={DATA_NOTEBOOK_URL} target="_blank" rel="noreferrer">
              این لینک
            </a>{" "}
            بخوانید. قدم‌به‌قدم مستندنویسی کردم و مسیر را توضیح دادم.
          </p>
          <p>
            در پایان این بخش، <strong>۳ فایل</strong> دیتای من تبدیل شد به{" "}
            <strong>۸ فایل</strong> در فرمت <Term>Parquet</Term>، که به دلیل
            باینری بودن و سرعت شناخته شده هست.
          </p>

          <Callout label="قانون اصلی این بخش">
            <p>
              هیچ چیز رو پاک نکنم؛ فقط داده‌های مشکوک علامت‌گذاری بشه و چیزی
              که نامشخص هست رو نامشخص در نظر بگیرم.
            </p>
          </Callout>
        </Section>
      </>
    ),
  },
  {
    id: "design-system",
    label: "سیستم دیزاین",
    icon: DesignSystemIcon,
    eyebrow: "زبان بصری",
    title: "چرا این شکل و این رنگ؟",
    body: (
      <>
        <p>
          سطح‌ها سیاهِ عمیق با ته‌رنگِ آلویی‌اند، نه خاکستریِ سرد؛ و فقط یک
          رنگِ برند داریم، قرمزِ لاکی، که فقط جایی می‌نشیند که توجه باید برود.
        </p>
        <ul>
          <li>تایپوگرافی: وزیرمتن، فاصله‌ی خط ۱٫۷ و بدون فاصله‌ی حروف</li>
          <li>راست‌چین واقعی با ویژگی‌های منطقی، نه چپ/راستِ ثابت</li>
          <li>حرکت: فقط یک چیز انیمیت می‌شود و هیچ‌چیز نمی‌پرد</li>
          <li>کمینه‌گرا: یک نقطه‌ی تمرکز، بقیه ساکت</li>
        </ul>
      </>
    ),
  },
  {
    id: "about-me",
    label: "درباره من",
    icon: AboutIcon,
    eyebrow: "سازنده",
    title: "سلام! من سازنده‌ی استارکوچم",
    body: (
      <>
        <p>
          این پروژه را برای هکاتون ساختم تا نشان بدهم یک مربی هوشمندِ
          فارسی‌زبان چه شکلی می‌تواند باشد.
        </p>
        <ul>
          <li>علاقه‌مند به هوش مصنوعی و تجربه‌ی کاربری</li>
          <li>باور دارم ابزار خوب، ساده و دقیق است</li>
        </ul>
        <p className="text-dust">
          این‌جا را با معرفی واقعی خودت پر کن: اسم، تخصص، و راه ارتباطی.
        </p>
      </>
    ),
  },
];
