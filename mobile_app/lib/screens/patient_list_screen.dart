import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/patient_provider.dart';
import '../models/patient.dart';
import 'patient_detail_screen.dart';

class PatientListScreen extends StatefulWidget {
  const PatientListScreen({super.key});

  @override
  State<PatientListScreen> createState() => _PatientListScreenState();
}

class _PatientListScreenState extends State<PatientListScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Patient> _filteredPatients = [];
  bool _isSearching = false;
  DateTime? _selectedDate;

  @override
  void initState() {
    super.initState();
  }

  Future<void> _searchPatients(String query) async {
    if (query.isEmpty) {
      setState(() {
        _filteredPatients = [];
      });
      return;
    }

    setState(() {
      _isSearching = true;
    });

    final apiService = context.read<ApiService>();
    final patients = await apiService.searchPatients(query);

    setState(() {
      _filteredPatients = patients;
      _isSearching = false;
    });
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
      _getPatientsByDate(picked);
    }
  }

  Future<void> _getPatientsByDate(DateTime date) async {
    setState(() {
      _isSearching = true;
    });

    final apiService = context.read<ApiService>();
    final patients = await apiService.getPatientsByDate(
      startDate: _formatDate(date),
      endDate: _formatDate(date),
    );

    setState(() {
      _filteredPatients = patients;
      _isSearching = false;
    });
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  void _openNewRecordScreen() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const PatientDetailScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: '搜索患者（姓名/拼音/电话）',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {
                              _filteredPatients = [];
                            });
                          },
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                ),
                onChanged: _searchPatients,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _selectDate,
                      icon: const Icon(Icons.calendar_today),
                      label: Text(
                        _selectedDate != null
                            ? '${_selectedDate!.year}-${_selectedDate!.month}-${_selectedDate!.day}'
                            : '按日期筛选',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: _isSearching
              ? const Center(child: CircularProgressIndicator())
              : _filteredPatients.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.search_off,
                            size: 80,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            '搜索患者或选择日期',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filteredPatients.length,
                      itemBuilder: (context, index) {
                        final patient = _filteredPatients[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: Colors.teal,
                              child: Text(
                                patient.name[0],
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                            title: Text(
                              patient.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${patient.gender} · ${patient.age}岁',
                                ),
                                if (patient.phone != null && patient.phone!.isNotEmpty)
                                  Text(patient.phone!),
                                if (patient.lastVisit != null)
                                  Text(
                                    '末诊: ${_formatDate(patient.lastVisit!)}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                              ],
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () async {
                              context.read<PatientProvider>().selectPatient(patient);
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => PatientDetailScreen(
                                    patient: patient,
                                  ),
                                ),
                              );
                              context.read<PatientProvider>().clearSelectedPatient();
                            },
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}
