import pytest
from src.services import analysis_service

def test_analyze_rootless_yang():
    # Case: Floating level is tight/large, Deep level is empty/weak => Rootless Yang
    data = {
        "pulse_grid": {
            "left-cun-fu": "大",
            "right-cun-fu": "紧",
            "left-chi-chen": "空",
            "right-chi-chen": "无根",
            "overall_description": "浮大中空"
        },
        "medical_record": {
            "prescription": "附子 60g, 干姜 30g"
        }
    }
    
    result = analysis_service.analyze_pulse_data(data)
    
    # Check Logic
    assert "真阳外越" in result["consistency_comment"] or "阳气外浮" in result["consistency_comment"]
    assert "四逆汤" in result["suggestion"]
    
    # Check Prescription Analysis
    assert "方向正确" in result["prescription_comment"]

def test_analyze_rootless_yang_bad_prescription():
    # Case: Rootless Yang but with Cold herbs
    data = {
        "pulse_grid": {
            "left-cun-fu": "浮大",
            "left-chi-chen": "微弱",
            "overall_description": "浮大无根"
        },
        "medical_record": {
            "prescription": "石膏 30g, 知母 10g"
        }
    }
    
    result = analysis_service.analyze_pulse_data(data)
    
    # Check Logic
    assert "真阳外越" in result["consistency_comment"] or "阳气外浮" in result["consistency_comment"]
    
    # Check Prescription Analysis Warning
    assert "警示" in result["prescription_comment"]
    assert "寒凉药物" in result["prescription_comment"]

def test_analyze_taiyang_cold():
    # Case: Floating Tight, Deep not empty
    data = {
        "pulse_grid": {
            "left-cun-fu": "紧",
            "right-cun-fu": "浮",
            "left-chi-chen": "有力", # Deep is strong, so not rootless
        },
        "medical_record": {
            "prescription": "麻黄 9g, 桂枝 6g"
        }
    }
    
    result = analysis_service.analyze_pulse_data(data)
    
    assert "太阳伤寒" in result["consistency_comment"]
    assert "麻黄汤" in result["suggestion"]
    assert "符合太阳病治疗原则" in result["prescription_comment"]

def test_analyze_middle_deficiency():
    # Case: Guan Middle is weak
    data = {
        "pulse_grid": {
            "left-guan-zhong": "弱",
            "right-guan-zhong": "空"
        },
        "medical_record": {}
    }
    
    result = analysis_service.analyze_pulse_data(data)
    
    assert "中焦脾胃" in result["consistency_comment"]
    assert "理中汤" in result["suggestion"]

def test_analyze_default_case():
    # Case: Nothing special
    data = {
        "pulse_grid": {
            "left-cun-fu": "缓",
            "left-chi-chen": "沉"
        },
        "medical_record": {}
    }
    
    result = analysis_service.analyze_pulse_data(data)
    
    assert "结合“望闻问切”" in result["consistency_comment"]
