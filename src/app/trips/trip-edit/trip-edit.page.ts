import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Trip } from "src/app/models/trip.model";
import { DataService } from "src/app/data.service";
import { Subscription } from "rxjs";
import { map } from "rxjs/operators";
import { NavController } from "@ionic/angular";

@Component({
  selector: "app-trip-edit",
  templateUrl: "./trip-edit.page.html",
  styleUrls: ["./trip-edit.page.scss"],
})
export class TripEditPage implements OnInit, OnDestroy {
  tripToEdit: Trip[];
  tripId: string;
  private tripSubscription: Subscription;

  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    // subscribe to any changes on the incoming route - using paraMap observable which contains route information
    this.route.paramMap.subscribe((paramMap) => {
      //check to make sure the route has a tripId param
      if (!paramMap.has("tripId")) {
        // throw an error - "no trip found, please try again" then navigate away
        this.navCtrl.navigateBack("/trips/tabs/all-trips");
        return;
      }
      this.isLoading = true;
      this.tripId = paramMap.get("tripId"); // get the id from the route params
      this.isLoading = true; // start the spinner whilst data is retrieved - as data is already in memory this shouldn't really be needed
      // whenever we get a new route, we get the latest behaviourSubject / value of the trips array in the dataService
      this.tripSubscription = this.dataService.trips
        .pipe(
          // the map rxjs operator is used to transform the recieved array into different data, re-mapping the data
          map((tripsArray) => {
            this.tripToEdit = tripsArray.filter((trip) => {
              return trip.tripId === this.tripId;
            }); // use the array filter method to filter out the trip matching the trip.id taken from route params
          })
        )
        .subscribe(() => {
          this.isLoading = false; // we now have the necessary Trip information, remove loading spinner.
        });
    });
  }

  ngOnDestroy() {
    this.tripSubscription.unsubscribe();
  }
}