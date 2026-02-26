import os
import requests
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY")
        self.api_url = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions")
        self.model = os.getenv("LLM_MODEL", "gpt-3.5-turbo") # OR gpt-4 or deepseek-chat
        self.provider = os.getenv("LLM_PROVIDER", "openai").lower() # 'openai' or 'anthropic'
        
    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            logger.warning("LLM_API_KEY not set. Returning mock response.")
            return "AI Analysis Service is not configured. Please set LLM_API_KEY in .env."

        # Detect Anthropic Provider by model name ONLY if provider is not set/default
        # We rely on os.getenv("LLM_PROVIDER") to be authoritative. 
        # If user explicitly sets LLM_PROVIDER=openai, we respect it (for proxies).
        if self.model.startswith("claude-") and not os.getenv("LLM_PROVIDER"):
            self.provider = "anthropic"

        if self.provider == "anthropic":
            return self._call_anthropic(system_prompt, user_prompt)
            
        # Default: OpenAI Compatible via Requests (OpenAI, DeepSeek, Kimi/Moonshot, etc.)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=300)
            if response.status_code != 200:
                print(f"Error Status Code: {response.status_code}")
                print(f"Error Response Text: {response.text}")
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"LLM API call failed: {e}")
            return f"Error analyzing data: {str(e)}"

    def _call_anthropic(self, system_prompt: str, user_prompt: str) -> str:
        try:
            from anthropic import Anthropic
        except ImportError:
            return "Anthropic library not installed. Please run `pip install anthropic`."

        try:
            # Support custom base_url for proxies
            base_url = None
            if "api.anthropic.com" not in self.api_url and "api.openai.com" not in self.api_url:
                 # If user set a custom URL that isn't the default OpenAI one, use it as base_url
                 base_url = self.api_url

            client = Anthropic(api_key=self.api_key, base_url=base_url)
            
            message = client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            return message.content[0].text
        except Exception as e:
            logger.error(f"Anthropic API call failed: {e}")
            return f"Error calling Claude: {str(e)}"

    def analyze_health_trend(self, records: List[Dict[str, Any]]) -> str:
        """
        Analyze a list of medical records to find health trends.
        """
        system_prompt = """你是一位精通郑钦安火神派的中医脉诊专家。
请分析患者的多次就诊记录，识别健康趋势变化。
重点关注九宫格脉象的变化规律、主诉症状的演变、处方用药的调整逻辑。
用通俗生动的语言输出分析报告，格式使用 Markdown。"""
        
        # Format records for LLM
        records_text = []
        for r in records[:5]: # Limit to last 5 records to save context
            records_text.append(f"Date: {r.get('visit_date')}\nComplaint: {r.get('complaint')}\nPulse: {json.dumps(r.get('pulse_grid', {}))}")
            
        user_prompt = "Patient History:\n" + "\n---\n".join(records_text)
        
        return self._call_llm(system_prompt, user_prompt)
        
    def generate_health_report(self, record: Dict[str, Any]) -> str:
        """
        Generate a detailed health report for a single record.
        Uses the three-part battle analysis template.
        """
        system_prompt = """你是一位精通郑钦安火神派学术体系的中医脉诊专家，擅长用"元气/阳气"视角解读病机，并能将脉象数据转化为立体的气机模型。
请严格按照以下模板输出分析报告，使用中文，语言风格要生动、有画面感，像一位老师在给学生复盘讲解。

## 首要判断：【脉药对应性审查】

在展开详细分析之前，首先判断当前处方用药与脉象是否吻合对应。
- **对应性结论**：[吻合 / 基本吻合 / 存在偏差 / 明显不符]
- **核心依据**：逐一审视每味药的药性方向（寒热温凉、升降浮沉）是否与脉象所反映的气机状态一致。例如：脉沉窄（寒凝）用附子（大热）→方向正确；脉沉窄用黄连（苦寒）→方向相反。
- **如有偏差**：指出哪味药与脉象矛盾，并说明可能的风险。

---

## 第一部分：【审视战场】脉象解码与病机画像

### 1. 基础情报
- 患者：[姓名/年龄/性别]
- 主诉：[核心症状/西医诊断]

### 2. 九宫格脉象解码（3D 建模）
将平面的文字描述转化为立体的"气机状态"。

- **整体脉势**：[描述：如沉、浮、窄、宽、弦等]
  - 象思维解码：这代表大盘处于什么状态？（例如：窄=寒主收引/管道受压；宽=气虚不敛/湿热充斥）
- **寸脉（上焦/天）**：[描述]
  - 物理意义：上焦的能量供应如何？（例如：沉=升不上去；空=物资匮乏；顶=压力过大/有邪闭塞）
- **关尺（中下焦/地）**：[描述]
  - 物理意义：中焦运化能力与下焦元气储备。（例如：应指=根基尚存；微欲绝=根基崩塌；滑=湿浊垃圾堆积）

### 3. 病机画像（元气视角）
- **一句话定性**：抛弃教材的"阴虚/气虚"套话，用物理学术语描述。例如：阳气被寒湿压制在底层的"冰封高压锅"状态。
- **矛盾点分析**：为什么会出现主诉症状？例如：血糖高（浊阴堆积）是因为锅炉火不旺（阳虚），导致燃料（糖）烧不掉，变成了垃圾。

## 第二部分：【排兵布阵】药象矢量分析

### 1. 核心战略
- 战术目标：[例如：温阳破冰 / 燥湿建中 / 引火归元]
- 方阵性质：[例如：四逆汤变局 / 理中汤加减]

### 2. 逐药/药组解码（兵种分工）
将方子拆解为几个战术小组，分析其"方向"与"力度"。

**① 破局/主将组（针对核心脉象）**
- 药物：[药名 + 剂量]
- 针对脉象：[例如：针对"尺脉沉/窄"]
- 药象矢量：解释为何选此药？（例如：附子的大热纯阳托起沉脉；吴茱萸的辛苦疏泄打开窄脉）

**② 守中/后勤组（针对中焦运化）**
- 药物：[药名 + 剂量]
- 针对脉象：[例如：针对"关脉不空/湿滞"]
- 药象矢量：解释如何重建中焦？（例如：干姜燥湿如烘干机；甘草伏火守中）

**③ 调节/向导组（针对局部或收尾）**
- 药物：[药名 + 剂量]
- 针对脉象：[例如：针对"寸脉稍空"]
- 药象矢量：解释特殊调整。（例如：山药微敛以固阴；肉桂引火归元）

### 3. 高阶思维（医嘱/变量解读）
如果医嘱中有"吃一周停某药"或剂量极小，解释其背后的权衡（如：通与敛的博弈）。

## 第三部分：【复盘总结】为什么这么治？

### 逻辑对冲
- 如果按常规（教科书/西医思维）治，会用什么药？（例如：滋阴药、苦寒降糖药）
- 后果推演：结合脉象，如果用了常规药，脉会怎么变？（例如：脉会更沉、更窄，病情加重）

### 点睛之笔
本案最精彩的一个用药或思路是什么？

## 第四部分：【名家会诊】现代经方大家如何开方？

分别从以下三位现代经方大家的学术风格出发，针对本案的脉象与病机，给出各自可能开出的具体方剂（含药物组成与剂量）。

### 1. 胡希恕（方证对应派）
- 辨证思路：从六经-方证对应角度，本案属于哪个经、哪个方证？
- 拟方：[具体方名 + 完整药物组成与剂量]
- 点评：胡老这样开方的核心逻辑是什么？

### 2. 蒲辅周（轻灵圆活派）
- 辨证思路：从蒲老擅长的轻剂、平调、顾护脾胃角度，如何看待本案？
- 拟方：[具体方名 + 完整药物组成与剂量]
- 点评：蒲老用药轻灵的精髓体现在哪里？

### 3. 吴佩衡（火神派重剂）
- 辨证思路：从吴老擅用附子大剂温阳的角度，本案阳虚程度如何判断？
- 拟方：[具体方名 + 完整药物组成与剂量]
- 点评：吴老与本案原方相比，用量和思路有何异同？"""

        user_prompt = f"请根据以下病历数据，按模板生成完整分析报告：\n\n{json.dumps(record, ensure_ascii=False, indent=2)}"

        return self._call_llm(system_prompt, user_prompt)

    def chat_with_records(self, query: str, context_records: List[Dict[str, Any]]) -> str:
        """
        RAG-style chat with provided context records.
        """
        system_prompt = """你是患者的私人健康助手，精通中医脉诊。
请仅根据提供的病历记录回答用户问题。如果记录中没有相关信息，请如实说明。
回答时引用对应的就诊日期，语言通俗易懂。"""
        
        context_text = ""
        for r in context_records:
             context_text += f"\n[Date: {r.get('visit_date')}] Complaint: {r.get('complaint')}, Diagnosis: {r.get('diagnosis')}, Note: {r.get('note')}"
             
        user_prompt = f"Context:\n{context_text}\n\nUser Question: {query}"
        
        return self._call_llm(system_prompt, user_prompt)

# Singleton instance
llm_service = LLMService()
