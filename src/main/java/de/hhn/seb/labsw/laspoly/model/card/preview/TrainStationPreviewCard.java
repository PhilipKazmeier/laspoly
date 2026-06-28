/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Node
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.model.card.preview;

import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.model.card.ActionMenuCard;
import de.hhn.seb.labsw.laspoly.model.card.PropertyPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.FieldConfiguration;
import de.hhn.seb.labsw.laspoly.model.field.TrainStation;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import java.util.ResourceBundle;
import javafx.scene.Node;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;

public class TrainStationPreviewCard
extends PropertyPreviewCard<TrainStation> {
    public TrainStationPreviewCard(TrainStation trainStation) {
        super(trainStation);
        this.setNodeHolder(new NodeHolder());
    }

    private String[] getOtherStationNames(int refStation) {
        String[] stat = new String[]{FieldConfiguration.getField(5).getName(), FieldConfiguration.getField(15).getName(), FieldConfiguration.getField(25).getName(), FieldConfiguration.getField(35).getName()};
        if (refStation == 5) {
            return new String[]{stat[1], stat[2], stat[3]};
        }
        if (refStation == 15) {
            return new String[]{stat[2], stat[3], stat[0]};
        }
        if (refStation == 25) {
            return new String[]{stat[3], stat[0], stat[1]};
        }
        if (refStation == 35) {
            return new String[]{stat[0], stat[1], stat[2]};
        }
        throw new InvalidParameterException("The given position should be a train station position.", "refStation", refStation);
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    public class NodeHolder
    extends ActionMenuCard.NodeHolder {
        private final EnhancedGroup imageGroup;

        public NodeHolder() {
            super(FXMLFile.PREVIEW_STATION);
            this.lookUpLabels("#stationnameLabel", "#descriptionlabel", "#pricelabel", "#pricevaluelabel", "#rentlabel", "#rentvaluelabel", "#rentw2label", "#rentw2valuelabel", "#rentw3label", "#rentw3valuelabel", "#rentw4label", "#rentw4valuelabel", "#ticketslabel", "#station1label", "#station1valuelabel", "#station2label", "#station2valuelabel", "#station3label", "#station3valuelabel", "#mortgagelabel", "#mortgagevaluelabel");
            this.imageGroup = new EnhancedGroup();
            ImageView imgV = new ImageView(DataLoader.getInstance().getGameImage(GameImage.IC_TRAIN_STATION));
            imgV.setFitHeight(64.0);
            imgV.setFitWidth(64.0);
            AnchorPane.setLeftAnchor((Node)imgV, (Double)18.0);
            AnchorPane.setRightAnchor((Node)imgV, (Double)18.0);
            AnchorPane.setTopAnchor((Node)imgV, (Double)10.0);
            this.imageGroup.setRz(180.0);
            this.imageGroup.setRx(270.0);
            this.imageGroup.setTy(11.0);
            this.imageGroup.setTx(50.0);
            this.imageGroup.setTz(75.0);
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            super.updateLabelTexts(res);
            this.label(0).setText(((TrainStation)TrainStationPreviewCard.this.getProperty()).getName());
            if (((TrainStation)TrainStationPreviewCard.this.getProperty()).getOwner() == null) {
                this.label(1).setText(res.getString("station_forsale"));
            } else if (((TrainStation)TrainStationPreviewCard.this.getProperty()).isMortgaged()) {
                this.label(1).setText(res.getString("station_ismortgaged"));
            } else {
                this.label(1).setText(String.format(res.getString("property_owner"), ((TrainStation)TrainStationPreviewCard.this.getProperty()).getOwner().getUser().getName()));
            }
            this.label(2).setText(res.getString("property_price"));
            this.label(3).setText(TrainStation.PRICE_INFO.getRent(0) + "");
            this.label(4).setText(res.getString("property_rent"));
            this.label(5).setText(TrainStation.PRICE_INFO.getRent(5) + "");
            this.label(6).setText(String.format(res.getString("station_rentwXStations"), 2));
            this.label(7).setText(TrainStation.PRICE_INFO.getRent(6) + "");
            this.label(8).setText(String.format(res.getString("station_rentwXStations"), 3));
            this.label(9).setText(TrainStation.PRICE_INFO.getRent(7) + "");
            this.label(10).setText(String.format(res.getString("station_rentwXStations"), 4));
            this.label(11).setText(TrainStation.PRICE_INFO.getRent(8) + "");
            String[] stationNames = TrainStationPreviewCard.this.getOtherStationNames(((TrainStation)TrainStationPreviewCard.this.getProperty()).getPosition());
            this.label(12).setText(res.getString("station_tickets"));
            this.label(13).setText(stationNames[0]);
            this.label(14).setText(TrainStation.PRICE_INFO.getRent(2) + "");
            this.label(15).setText(stationNames[1]);
            this.label(16).setText(TrainStation.PRICE_INFO.getRent(3) + "");
            this.label(17).setText(stationNames[2]);
            this.label(18).setText(TrainStation.PRICE_INFO.getRent(4) + "");
            this.label(19).setText(res.getString("property_mortgage"));
            this.label(20).setText(TrainStation.PRICE_INFO.getRent(1) + "");
        }

        @Override
        protected int[] getLabelsFromInterest() {
            int propertyCount;
            int[] colouredLabels = ((TrainStation)TrainStationPreviewCard.this.getProperty()).getOwner() == null ? new int[]{2, 3} : (((TrainStation)TrainStationPreviewCard.this.getProperty()).isMortgaged() ? new int[]{} : ((propertyCount = ((TrainStation)TrainStationPreviewCard.this.getProperty()).getFieldGroup().getOwnersPropsCount(((TrainStation)TrainStationPreviewCard.this.getProperty()).getOwner())) == 1 ? new int[]{4, 5} : (propertyCount == 2 ? new int[]{6, 7} : (propertyCount == 3 ? new int[]{8, 9} : new int[]{10, 11}))));
            return colouredLabels;
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{" + "imageGroup=" + this.imageGroup + '}';
        }
    }
}

