import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ControlErrorMessageComponent } from './control-error-message/control-error-message.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

// import { ControlErrorMessageComponent } from './control-error-message/control-error-message';


@NgModule({
    declarations: [ControlErrorMessageComponent],
    imports: [
        IonicModule,
        TranslateModule.forChild(),
        CommonModule
    ],
    exports: [ControlErrorMessageComponent]
})
export class ComponentsModule { }
