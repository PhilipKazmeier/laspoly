/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.model.card.preview;

import de.hhn.seb.labsw.laspoly.model.building.Factory;
import de.hhn.seb.labsw.laspoly.model.building.Hotel;
import de.hhn.seb.labsw.laspoly.model.card.ActionMenuCard;
import de.hhn.seb.labsw.laspoly.model.card.PropertyPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.FieldGroup;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.model.priceinfo.StreetPriceInfo;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;
import javafx.scene.layout.AnchorPane;

public class StreetPreviewCard
extends PropertyPreviewCard<Street> {
    public StreetPreviewCard(Street str) {
        super(str);
        this.setNodeHolder(new NodeHolder());
    }

    @Override
    public EnhancedGroup drawPreview() {
        int[] rgb = new int[]{(int)(((Street)this.getProperty()).getColor().getRed() * 255.0), (int)(((Street)this.getProperty()).getColor().getGreen() * 255.0), (int)(((Street)this.getProperty()).getColor().getBlue() * 255.0)};
        String hex = String.format("#%02x%02x%02x", rgb[0], rgb[1], rgb[2]);
        ((NodeHolder)this.getNodeHolder()).previewColorBarPane.setStyle("-fx-background-color: " + hex + ";");
        EnhancedGroup ret = super.drawPreview();
        if (((Street)this.getProperty()).getColor().getBrightness() < 0.9) {
            this.getNodeHolder().label(0).setStyle("-fx-text-fill: white;");
        } else {
            this.getNodeHolder().label(0).setStyle("-fx-text-fill: black;");
        }
        return ret;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    public class NodeHolder
    extends ActionMenuCard.NodeHolder {
        private final AnchorPane previewColorBarPane;

        public NodeHolder() {
            super(FXMLFile.PREVIEW_STREET);
            this.lookUpLabels("#streetnamelabel", "#ownerlabel", "#pricelabel", "#pricevaluelabel", "#rentlabel", "#rentvaluelabel", "#rent1houselabel", "#rent1housevaluelabel", "#rent2houselabel", "#rent2housevaluelabel", "#rent3houselabel", "#rent3housevaluelabel", "#rent4houselabel", "#rent4housevaluelabel", "#renthotellabel", "#renthotelvaluelabel", "#rentfactorylabel", "#rentfactoryvaluelabel", "#househotelcostlabel", "#househotelcostvaluelabel", "#factorycostlabel", "#factorycostvaluelabel", "#hypotheclabel", "#hypothecvaluelabel");
            this.previewColorBarPane = (AnchorPane)this.getLayout().lookup("#colorbarpane");
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            boolean isSingleField;
            super.updateLabelTexts(res);
            this.label(0).setText(((Street)StreetPreviewCard.this.getProperty()).getName());
            if (((Street)StreetPreviewCard.this.getProperty()).isMortgaged()) {
                this.update(this.label(1), res, "street_ismortgaged", new Object[0]);
            } else if (((Street)StreetPreviewCard.this.getProperty()).getOwner() != null) {
                this.update(this.label(1), res, "property_owner", ((Street)StreetPreviewCard.this.getProperty()).getOwner().getUser().getName());
            } else {
                this.label(1).setText(res.getString("street_forsale"));
            }
            this.update(this.label(2), res, "property_price", new Object[0]);
            this.update(this.label(4), res, "property_rent", new Object[0]);
            this.update(this.label(6), res, "street_w1House", new Object[0]);
            this.update(this.label(8), res, "street_wXHouses", 2);
            this.update(this.label(10), res, "street_wXHouses", 3);
            this.update(this.label(12), res, "street_wXHouses", 4);
            this.update(this.label(14), res, "street_wHotel", new Object[0]);
            this.update(this.label(16), res, "street_factory_revenue", new Object[0]);
            this.update(this.label(18), res, "street_housecosts", new Object[0]);
            this.update(this.label(20), res, "street_factorycosts", new Object[0]);
            this.update(this.label(22), res, "property_mortgage", new Object[0]);
            StreetPriceInfo info = ((Street)StreetPreviewCard.this.getProperty()).getPriceInfo();
            this.label(3).setText(String.valueOf(info.getRent(0)));
            FieldGroup fieldGroup = ((Street)StreetPreviewCard.this.getProperty()).getFieldGroup();
            boolean bl = isSingleField = fieldGroup.getGroupedProperties().size() == 1;
            if (isSingleField || !fieldGroup.ownsAllProps(((Street)StreetPreviewCard.this.getProperty()).getOwner())) {
                this.label(5).setText(info.getRent(6) + "");
            } else {
                this.label(5).setText(String.valueOf(info.getRent(6) * 2));
            }
            this.label(7).setText(info.getRent(7) + "");
            this.label(9).setText(info.getRent(8) + "");
            this.label(11).setText(info.getRent(9) + "");
            this.label(13).setText(info.getRent(10) + "");
            this.label(15).setText(info.getRent(11) + "");
            this.label(17).setText(info.getRent(5) + "");
            this.label(19).setText(info.getRent(2) + "");
            this.label(21).setText(info.getRent(4) + "");
            this.label(23).setText(info.getRent(1) + "");
        }

        @Override
        protected int[] getLabelsFromInterest() {
            if (((Street)StreetPreviewCard.this.getProperty()).getOwner() == null) {
                return new int[]{2, 3};
            }
            if (((Street)StreetPreviewCard.this.getProperty()).isMortgaged()) {
                return new int[0];
            }
            if (((Street)StreetPreviewCard.this.getProperty()).getBuildings().isEmpty()) {
                return new int[]{4, 5};
            }
            if (((Street)StreetPreviewCard.this.getProperty()).getBuildings().get(0) instanceof Hotel) {
                return new int[]{14, 15};
            }
            if (((Street)StreetPreviewCard.this.getProperty()).getBuildings().get(0) instanceof Factory) {
                return new int[]{16, 17};
            }
            if (((Street)StreetPreviewCard.this.getProperty()).getBuildings().size() == 1) {
                return new int[]{6, 7};
            }
            if (((Street)StreetPreviewCard.this.getProperty()).getBuildings().size() == 2) {
                return new int[]{8, 9};
            }
            if (((Street)StreetPreviewCard.this.getProperty()).getBuildings().size() == 3) {
                return new int[]{10, 11};
            }
            return new int[]{12, 13};
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{" + "previewColorBarPane=" + this.previewColorBarPane + '}';
        }
    }
}

