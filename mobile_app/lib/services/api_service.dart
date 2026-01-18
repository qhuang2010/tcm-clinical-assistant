import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/patient.dart';

class ApiService extends ChangeNotifier {
  late Dio _dio;
  String _baseUrl = 'http://localhost:8000';
  bool _isConnected = false;

  ApiService() {
    _initDio();
    _loadBaseUrl();
  }

  void _initDio() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        debugPrint('API Request: ${options.method} ${options.uri}');
        return handler.next(options);
      },
      onResponse: (response, handler) {
        debugPrint('API Response: ${response.statusCode} ${response.data}');
        return handler.next(response);
      },
      onError: (error, handler) {
        debugPrint('API Error: ${error.message}');
        return handler.next(error);
      },
    ));
  }

  Future<void> _loadBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString('api_base_url');
    if (savedUrl != null) {
      _baseUrl = savedUrl;
      _initDio();
    }
  }

  Future<void> setBaseUrl(String url) async {
    _baseUrl = url;
    _initDio();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', url);
    notifyListeners();
  }

  String get baseUrl => _baseUrl;
  bool get isConnected => _isConnected;

  Future<bool> testConnection() async {
    try {
      final response = await _dio.get('/');
      _isConnected = response.statusCode == 200;
      return _isConnected;
    } catch (e) {
      _isConnected = false;
      return false;
    }
  }

  Future<List<Patient>> searchPatients(String query) async {
    try {
      final response = await _dio.get(
        '/api/patients/search',
        queryParameters: {'query': query},
      );
      return (response.data as List)
          .map((json) => Patient.fromJson(json))
          .toList();
    } catch (e) {
      debugPrint('Error searching patients: $e');
      return [];
    }
  }

  Future<List<Patient>> getPatientsByDate({
    String? startDate,
    String? endDate,
  }) async {
    try {
      final response = await _dio.get(
        '/api/patients/by_date',
        queryParameters: {
          if (startDate != null) 'start_date': startDate,
          if (endDate != null) 'end_date': endDate,
        },
      );
      return (response.data as List)
          .map((json) => Patient.fromJson(json))
          .toList();
    } catch (e) {
      debugPrint('Error getting patients by date: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> getPatientLatestRecord(int patientId) async {
    try {
      final response = await _dio.get('/api/patients/$patientId/latest_record');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Error getting patient record: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getPatientHistory(int patientId) async {
    try {
      final response = await _dio.get('/api/patients/$patientId/history');
      return List<Map<String, dynamic>>.from(response.data);
    } catch (e) {
      debugPrint('Error getting patient history: $e');
      return [];
    }
  }

  Future<List<Practitioner>> getPractitioners() async {
    try {
      final response = await _dio.get('/api/practitioners');
      return (response.data as List)
          .map((json) => Practitioner.fromJson(json))
          .toList();
    } catch (e) {
      debugPrint('Error getting practitioners: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> saveRecord(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/api/records/save', data: data);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Error saving record: $e');
      rethrow;
    }
  }

  Future<AnalysisResult> analyzeRecord(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/api/analyze', data: data);
      return AnalysisResult.fromJson(response.data);
    } catch (e) {
      debugPrint('Error analyzing record: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> searchSimilarRecords(
    Map<String, dynamic> pulseGrid,
  ) async {
    try {
      final response = await _dio.post(
        '/api/records/search_similar',
        data: {'pulse_grid': pulseGrid},
      );
      return List<Map<String, dynamic>>.from(response.data);
    } catch (e) {
      debugPrint('Error searching similar records: $e');
      return [];
    }
  }
}
