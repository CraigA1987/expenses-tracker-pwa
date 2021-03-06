import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { DataService } from "src/app/data.service";
import { UserService } from "src/app/user.service";

@Component({
  selector: "app-recipt-new",
  templateUrl: "./recipt-new.page.html",
  styleUrls: ["./recipt-new.page.scss"],
})
export class ReciptNewPage implements OnInit {
  form: FormGroup;
  tripId: string;
  newReceipt: any = {};

  constructor(
    private dataService: DataService,
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      this.tripId = paramMap.get("tripId"); // get the id from the route params
    });
    // create the reactive form
    this.form = new FormGroup({
      // We use patch Value on this form control once we have an image so that its updated!
      image: new FormControl(null),
      price: new FormControl(null, {
        validators: [
          Validators.required,
          Validators.max(10000),
          Validators.min(-100),
        ],
      }),
    });
  }

  // the image-picker.component.ts emits this event as an OUTPUT, so that the recipt.new.page.html fires a custom event
  // the paramenter is the imageData, passed as a generic $event object in the custom event, allowing the parameter to be passed
  // between the two components when ever an image is picked.
  onImagePicked(imageData: string) {
    this.form.patchValue({ image: imageData }); // form data is populated by imageData string from the Camera event
  }

  onAddReceipt() {
    if (!this.form.valid || !this.form.get("image").value) {
      return;
    }
    // send new receipt data to the data service to save to database and emit through application
    this.newReceipt.user = this.userService.user.email;
    this.newReceipt.tripId = this.tripId;
    this.newReceipt.image = this.form.value.image;
    this.newReceipt.price = Number(this.form.value.price.toFixed(2)); // toFixed returns a string of the price limited to 2 decimal places. Number converts this back into a number again
    this.newReceipt.timestamp = new Date().toISOString();
    this.dataService.newReceipt(this.newReceipt);
  }
}
