import 'package:flutter/foundation.dart';
import '../models/patient.dart';

class PatientProvider extends ChangeNotifier {
  List<Patient> _patients = [];
  Patient? _selectedPatient;
  Map<String, dynamic>? _pulseGrid;

  List<Patient> get patients => _patients;
  Patient? get selectedPatient => _selectedPatient;
  Map<String, dynamic>? get pulseGrid => _pulseGrid;

  void setPatients(List<Patient> patients) {
    _patients = patients;
    notifyListeners();
  }

  void selectPatient(Patient patient) {
    _selectedPatient = patient;
    notifyListeners();
  }

  void clearSelectedPatient() {
    _selectedPatient = null;
    _pulseGrid = null;
    notifyListeners();
  }

  void updatePulseGrid(Map<String, dynamic> grid) {
    _pulseGrid = grid;
    notifyListeners();
  }

  void resetPulseGrid() {
    _pulseGrid = {};
    notifyListeners();
  }
}
