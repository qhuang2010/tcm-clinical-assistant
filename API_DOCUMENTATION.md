# API 文档

中医脉象九宫格OCR识别系统 API 接口文档

## 基础信息

- **Base URL**: `http://localhost:8000` (开发环境)
- **Content-Type**: `application/json`
- **响应格式**: JSON

## 认证

当前版本无需认证，未来版本将添加Token认证。

---

## 接口列表

### 1. 健康检查

检查API服务是否正常运行。

**请求**
```
GET /
```

**响应**
```
Status: 200 OK
Content-Type: text/html
```

---

### 2. 搜索患者

根据姓名、拼音或电话搜索患者。

**请求**
```
GET /api/patients/search?query={query}
```

**参数**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| query | string | 是 | 搜索关键词（姓名/拼音/电话） |

**请求示例**
```
GET /api/patients/search?query=张
```

**响应示例**
```json
[
  {
    "id": 1,
    "name": "张三",
    "gender": "男",
    "age": 30,
    "phone": "13800138000",
    "pinyin": "zs",
    "last_visit": "2024-01-15"
  }
]
```

---

### 3. 按日期获取患者

获取指定日期范围内的患者列表。

**请求**
```
GET /api/patients/by_date?start_date={date}&end_date={date}
```

**参数**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| start_date | string | 否 | 开始日期 (YYYY-MM-DD) |
| end_date | string | 否 | 结束日期 (YYYY-MM-DD) |

**请求示例**
```
GET /api/patients/by_date?start_date=2024-01-01&end_date=2024-01-31
```

**响应示例**
```json
[
  {
    "id": 1,
    "name": "李明",
    "gender": "男",
    "age": 34,
    "phone": "13800138001",
    "last_visit": "2024-01-15"
  }
]
```

---

### 4. 获取患者最新记录

获取指定患者的最新医疗记录。

**请求**
```
GET /api/patients/{patient_id}/latest_record
```

**路径参数**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| patient_id | integer | 是 | 患者ID |

**响应示例**
```json
{
  "record_id": 1,
  "patient_info": {
    "name": "张三",
    "age": 30,
    "gender": "男",
    "phone": "13800138000"
  },
  "medical_record": {
    "complaint": "头痛，失眠",
    "prescription": "桂枝汤",
    "note": ""
  },
  "pulse_grid": {
    "left-cun-fu": "浮",
    "left-guan-fu": "弦",
    "left-chi-fu": "弱",
    "right-cun-fu": "浮",
    "right-guan-fu": "弦",
    "right-chi-fu": "弱"
  }
}
```

---

### 5. 获取患者历史记录

获取指定患者的所有历史记录列表。

**请求**
```
GET /api/patients/{patient_id}/history
```

**路径参数**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| patient_id | integer | 是 | 患者ID |

**响应示例**
```json
[
  {
    "id": 1,
    "visit_date": "2024-01-15",
    "complaint": "头痛"
  },
  {
    "id": 2,
    "visit_date": "2024-01-10",
    "complaint": "失眠"
  }
]
```

---

### 6. 获取医师列表

获取所有医师（医生和老师）列表。

**请求**
```
GET /api/practitioners
```

**响应示例**
```json
[
  {
    "id": 1,
    "name": "主治医师",
    "role": "doctor"
  },
  {
    "id": 2,
    "name": "王春",
    "role": "teacher"
  },
  {
    "id": 3,
    "name": "舒建平",
    "role": "teacher"
  }
]
```

---

### 7. 保存病历

创建或更新医疗记录。如果同一患者当天已有记录，则更新该记录。

**请求**
```
POST /api/records/save
```

**请求体**
```json
{
  "patient_info": {
    "name": "张三",
    "gender": "男",
    "age": 30,
    "phone": "13800138000"
  },
  "medical_record": {
    "complaint": "头痛，头晕",
    "prescription": "桂枝汤加减",
    "note": "需要复诊"
  },
  "pulse_grid": {
    "left-cun-fu": "浮",
    "left-guan-fu": "弦",
    "left-chi-fu": "弱",
    "right-cun-fu": "浮",
    "right-guan-fu": "弦",
    "right-chi-fu": "弱",
    "overall_description": "左手浮弦弱，右手浮弦弱"
  },
  "mode": "personal",
  "teacher": ""
}
```

**字段说明**
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| patient_info | object | 是 | 患者信息 |
| patient_info.name | string | 是 | 患者姓名 |
| patient_info.gender | string | 是 | 性别（男/女） |
| patient_info.age | integer | 是 | 年龄 |
| patient_info.phone | string | 否 | 电话 |
| medical_record | object | 是 | 病历信息 |
| medical_record.complaint | string | 是 | 主诉 |
| medical_record.prescription | string | 否 | 处方 |
| medical_record.note | string | 否 | 备注 |
| pulse_grid | object | 是 | 脉象九宫格数据 |
| mode | string | 否 | 模式（personal/shadowing） |
| teacher | string | 否 | 老师姓名（shadowing模式需要） |

**响应示例**
```json
{
  "status": "success",
  "message": "Record saved successfully",
  "record_id": 1
}
```

---

### 8. 分析病历

根据脉象数据和病历信息进行智能分析，提供诊断建议。

**请求**
```
POST /api/analyze
```

**请求体**
```json
{
  "medical_record": {
    "complaint": "头痛，头晕",
    "prescription": "桂枝汤加减"
  },
  "pulse_grid": {
    "left-cun-fu": "浮",
    "left-guan-fu": "弦",
    "left-chi-fu": "弱",
    "right-cun-fu": "浮",
    "right-guan-fu": "弦",
    "right-chi-fu": "弱",
    "overall_description": "左手浮弦弱，右手浮弦弱"
  }
}
```

**响应示例**
```json
{
  "consistency_comment": "【郑钦安视角】脉象呈现"寸关尺浮取可见，但沉取无力或空虚"，此乃"阳气外浮，下元虚寒"之象。虽浮部见紧或细，切不可误认为单纯表实证。沉取无根，说明肾阳虚衰，真阳不能潜藏，反逼虚阳上浮外越。若主诉有"头晕、面红"等看似热象，实为"真寒假热"。",
  "prescription_comment": "处方中包含扶阳药物，符合"扶阳抑阴"的治疗原则，方向正确。",
  "suggestion": "建议：急当扶阳抑阴，引火归元。切忌使用发散风寒之辛温解表药（如麻黄）或苦寒直折之药，恐耗散仅存之真阳。推荐方剂：四逆汤、白通汤或潜阳丹加减。"
}
```

---

### 9. 搜索相似病历

根据脉象数据搜索相似的历史病历。

**请求**
```
POST /api/records/search_similar
```

**请求体**
```json
{
  "pulse_grid": {
    "left-cun-fu": "浮",
    "left-guan-fu": "弦",
    "left-chi-fu": "弱"
  }
}
```

**响应示例**
```json
[
  {
    "record_id": 5,
    "patient_name": "李四",
    "visit_date": "2024-01-10",
    "score": 30,
    "pulse_grid": {
      "left-cun-fu": "浮",
      "left-guan-fu": "弦",
      "left-chi-fu": "弱"
    },
    "matches": ["left-cun-fu==left-cun-fu", "left-guan-fu==left-guan-fu"],
    "complaint": "头晕"
  }
]
```

**返回前5个最相似的病历，按匹配度排序。**

---

### 10. 验证数据

验证输入数据是否符合JSON Schema规范。

**请求**
```
POST /api/validate
```

**请求体**
```json
{
  "test": "data"
}
```

**响应示例**
```json
{
  "valid": false,
  "errors": [
    "JSON Schema验证失败: 'image_info' is a required property
...
  ]
}
```

---

### 11. 获取病历详情

获取指定病历的详细信息。

**请求**
```
GET /api/records/{record_id}
```

**路径参数**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| record_id | integer | 是 | 病历ID |

**响应示例**
```json
{
  "medical_record": {
    "complaint": "头痛",
    "prescription": "桂枝汤"
  },
  "pulse_grid": {
    "left-cun-fu": "浮",
    "left-guan-fu": "弦",
    "left-chi-fu": "弱"
  }
}
```

---

### 12. 删除病历

删除指定的病历记录。

**请求**
```
DELETE /api/records/{record_id}
```

**路径参数**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| record_id | integer | 是 | 病历ID |

**响应示例**
```json
{
  "status": "success",
  "message": "Record 1 deleted"
}
```

---

## 错误码

| HTTP状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 数据模型

### Patient（患者）
```json
{
  "id": "integer",
  "name": "string",
  "gender": "string",
  "age": "integer",
  "phone": "string | null",
  "pinyin": "string | null",
  "last_visit": "string (YYYY-MM-DD) | null"
}
```

### MedicalRecord（病历）
```json
{
  "id": "integer | null",
  "patient_info": "object",
  "medical_record": "object",
  "pulse_grid": "object"
}
```

### PulseGrid（脉象九宫格）
脉象九宫格采用以下格式：

**格式**: `{手}-{位置}-{层次}`

- **手**: left, right
- **位置**: cun, guan, chi
- **层次**: fu, zhong, chen

示例:
```json
{
  "left-cun-fu": "浮",
  "left-guan-fu": "弦",
  "left-chi-fu": "弱",
  "right-cun-fu": "浮",
  "right-guan-fu": "弦",
  "right-chi-fu": "弱",
  "overall_description": "左手浮弦弱，右手浮弦弱"
}
```

---

## 使用示例

### cURL 示例

```bash
# 搜索患者
curl -X GET "http://localhost:8000/api/patients/search?query=张"

# 保存病历
curl -X POST "http://localhost:8000/api/records/save" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_info": {
      "name": "张三",
      "gender": "男",
      "age": 30
    },
    "medical_record": {
      "complaint": "头痛"
    },
    "pulse_grid": {
      "left-cun-fu": "浮"
    }
  }'

# 分析病历
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "medical_record": {
      "complaint": "头痛"
    },
    "pulse_grid": {
      "left-cun-fu": "浮"
    }
  }'
```

### JavaScript/Fetch 示例

```javascript
// 搜索患者
fetch('http://localhost:8000/api/patients/search?query=张')
  .then(response => response.json())
  .then(data => console.log(data));

// 保存病历
fetch('http://localhost:8000/api/records/save', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    patient_info: {
      name: '张三',
      gender: '男',
      age: 30,
    },
    medical_record: {
      complaint: '头痛',
    },
    pulse_grid: {
      'left-cun-fu': '浮',
    },
  }),
})
  .then(response => response.json())
  .then(data => console.log(data));
```

### Python/requests 示例

```python
import requests

# 搜索患者
response = requests.get('http://localhost:8000/api/patients/search', params={'query': '张'})
patients = response.json()
print(patients)

# 保存病历
data = {
    'patient_info': {
        'name': '张三',
        'gender': '男',
        'age': 30,
    },
    'medical_record': {
        'complaint': '头痛',
    },
    'pulse_grid': {
        'left-cun-fu': '浮',
    },
}
response = requests.post('http://localhost:8000/api/records/save', json=data)
result = response.json()
print(result)
```

---

## 更新日志

### v1.0.0 (2024-01-17)
- 初始版本
- 实现所有核心接口
- 支持患者管理、病历录入、智能分析

---

## 联系方式

如有问题，请联系：
- GitHub Issues: https://github.com/qhuang2010/zhongyimedic/issues
- Email: support@example.com
