/* eslint-disable @angular-eslint/no-output-native */
/* eslint-disable @angular-eslint/prefer-inject */
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationsService } from '../../services/organizations.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-organization-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './organization-modal.component.html',
  styleUrls: ['./organization-modal.component.css']
})
export class OrganizationModalComponent implements OnChanges {
  @Input() organization: any = null;
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  orgForm: FormGroup;

  constructor(private fb: FormBuilder, private orgService: OrganizationsService) {
    this.orgForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnChanges(): void {
    if (this.organization) {
      this.orgForm.patchValue({ name: this.organization.name });
    } else {
      this.orgForm.reset();
    }
  }

  save() {
    if (this.orgForm.invalid) return;

    const payload = this.orgForm.value;

      if (this.organization) {
      // Edit
      this.orgService.updateOrganization(this.organization.id, payload).subscribe(() => {
        this.saved.emit();
        this.close.emit();
      });
    } else {
      // Add
      this.orgService.createOrganization(payload).subscribe(() => {
        this.saved.emit();
        this.close.emit();
      });
    }
  }
}
