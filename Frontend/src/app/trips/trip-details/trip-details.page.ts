import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { DataService } from "src/app/data.service";
import { NavController } from "@ionic/angular";
import { map } from "rxjs/operators";

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import { FileOpener } from "@ionic-native/file-opener/ngx";

import { Platform } from "@ionic/angular";

import { Trip } from "src/app/models/trip.model";
import { Receipt } from "src/app/models/reciept.model";
import { Plugins, FilesystemDirectory } from "@capacitor/core";
const { Filesystem } = Plugins;

@Component({
  selector: "app-trip-details",
  templateUrl: "./trip-details.page.html",
  styleUrls: ["./trip-details.page.scss"],
})
export class TripDetailsPage implements OnInit, OnDestroy {
  tripToEdit: Trip[];
  tripId: string;
  currentReceipts: Receipt[];
  noReceiptFound: boolean;
  private tripSubscription: Subscription;
  private receiptsSubscription: Subscription;

  pdfObj: any = null;

  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private navCtrl: NavController,
    private platform: Platform,
    private fileOpener: FileOpener
  ) {}

  ngOnInit() {
    // subscribe to any changes on the incoming route - using paraMap observable which contains route information
    this.route.paramMap.subscribe((paramMap) => {
      //check to make sure the route has a tripId param
      // console.log(paramMap);
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
            // console.log(tripsArray);
            this.tripToEdit = tripsArray.filter((trip) => {
              return trip.tripId === this.tripId;
            }); // use the array filter method to filter out the trip matching the trip.id taken from route params
          })
        )
        .subscribe(() => {
          // After trips have loaded I then need to fetch all recipts with the trip id and display them here...
          this.receiptsSubscription = this.dataService.reciepts
            .pipe(
              map((receiptsArray) => {
                this.currentReceipts = receiptsArray.filter((receipt) => {
                  return receipt.tripId === this.tripId;
                });
              })
            )
            .subscribe(() => {
              this.isLoading = false;
            });
        });
    });
  }

  ionViewWillEnter() {
    // sort the receipts, earlest date first
    this.currentReceipts.sort((a, b) => {
      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
    });
  }

  downloadPDF() {
    console.log("Download hit");
    // Firstly we need to create the PDF
    const content = []; // content array is where we create all of the content before creating the pdf

    // Convert the dates to correct formate in DD-MM-YYYY format for PDF
    const dateConversionFrom = new Date(this.tripToEdit[0].dateFrom)
      .toJSON()
      .slice(0, 10)
      .split("-")
      .reverse()
      .join("/");
    const dateConversionTo = new Date(this.tripToEdit[0].dateTo)
      .toJSON()
      .slice(0, 10)
      .split("-")
      .reverse()
      .join("/");

    // Push in the initial trip details data
    content.push(
      {
        text: this.tripToEdit[0].location,
        style: "header",
      },
      {
        text: `${dateConversionFrom} - ${dateConversionTo}`,
        style: "subheader",
      },
      {
        text: `Total amount to claim: £${this.tripToEdit[0].price.toFixed(2)}`,
        style: "subheader",
      },
      "\n\n"
    );

    // loop through the receipts and push individual receipt data into the content array
    this.currentReceipts.forEach((receipt) => {
      const timestampConversion = new Date(receipt.timestamp)
        .toJSON()
        .slice(0, 10)
        .split("-")
        .reverse()
        .join("/");

      content.push(
        {
          text: timestampConversion,
          style: "subheader",
        },
        `Amount £${receipt.price.toFixed(2)}`,
        {
          image: receipt.image,
          width: 225,
        },
        "\n\n"
      );
    });

    // create the PDF with the pushed content data
    const docDefinition = {
      watermark: {
        text: "Expenses Tracker App",
        color: "green",
        opacity: 0.1,
        bold: true,
      },
      content: content,
      styles: {
        header: {
          fontSize: 18,
          bold: true,
        },
        subheader: {
          fontSize: 15,
          bold: true,
        },
        quote: {
          italics: true,
        },
        small: {
          fontSize: 8,
        },
      },
    };
    this.pdfObj = pdfMake.createPdf(docDefinition);
    console.log(this.pdfObj);

    // need to handle download different on web compared to native
    if (this.platform.is("cordova")) {
      this.pdfObj.getBase64(async (data) => {
        try {
          let path = `myTrip_${Date.now()}.pdf`;
          // write the file to the local file system
          const result = await Filesystem.writeFile({
            path,
            data,
            directory: FilesystemDirectory.External,
            recursive: true,
          });
          // once file is written, open it
          this.fileOpener.open(`${result.uri}`, "application/pdf");
        } catch (e) {
          console.log("Unable to write file", e);
        }
      });
    } else {
      this.pdfObj.download();
    }
  }

  ngOnDestroy() {
    if (this.receiptsSubscription) {
      this.receiptsSubscription.unsubscribe();
    }
    if (this.tripSubscription) {
      this.tripSubscription.unsubscribe();
    }
  }
}
