import { environment } from './../../../environments/environment';
import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Events } from '@ionic/angular';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  currentUser;

  constructor(private api: ApiService,
              private events: Events) {
    const user = localStorage.getItem('user');
    // if (!user || environment.production) { return; }
    if (!user) { return; }

    // this.refreshUserData();
    this.updateAndSaveCarrentUser(JSON.parse(user));
  }

  login(userData) {
    return this.api.post('/login', userData);
  }

  getPatients() {
    return this.api.get(`/doctors/${this.currentUser.id}/patients`);
  }

  getPatient(patientId) {
    return this.api.get(`/patients/${patientId}`);
  }

  addPatient(patientData) {
    return this.api.post(`/doctors/${this.currentUser.id}/patients/`, patientData);
  }

  editPatient(patientId, patientData) {
    return this.api.put(`/patients/${patientId}`, patientData);
  }

  getPatientModules(patientId) {
    return this.api.get(`/patients/${patientId}/vr_modules`);
  }

  getPatientSessionId(patientId, moduleId, headsetId) {
    return this.api.post('/module_sessions', {
      patient_id: patientId, doctor_id: this.currentUser.id,
      vr_module_id: moduleId, headset_id: headsetId
    });
  }

  getPatientModuleSessions(patientId, moduleId) {
    return this.api.get('/module_sessions', {
      patient_id: patientId, doctor_id: this.currentUser.id,
      vr_module_id: moduleId
    });
  }

  getCenterHeadsets() {
    return this.api.get('/headsets');
  }

  async refreshUserData() {
    try {
      const result: any = await this.api.get(`/doctors/${this.currentUser.id}`);
      this.updateAndSaveCarrentUser(result);
    } catch (err) {
      console.log('refreshUserData Error', err);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async updateAndSaveCarrentUser(user) {
    if (JSON.stringify(this.currentUser) === JSON.stringify(user)) { return; }
    this.updateCarrentUser(user);
    // if (environment.production) { return; }

    localStorage.setItem('user', JSON.stringify(user));
  }

  async updateCarrentUser(user) {
    this.currentUser = user;
    this.events.publish('userUpdate', user);
  }

  logout() {
    this.currentUser = null;
    this.events.publish('userUpdate', null);
  }

}
