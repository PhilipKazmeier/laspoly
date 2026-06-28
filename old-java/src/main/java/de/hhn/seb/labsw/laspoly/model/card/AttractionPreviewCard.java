/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.image.Image
 *  javafx.scene.image.ImageView
 */
package de.hhn.seb.labsw.laspoly.model.card;

import de.hhn.seb.labsw.laspoly.model.card.ActionMenuCard;
import de.hhn.seb.labsw.laspoly.model.card.PropertyPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.Attraction;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;

public class AttractionPreviewCard
extends PropertyPreviewCard<Attraction> {
    public AttractionPreviewCard(Attraction attraction, Image image) {
        super(attraction);
        this.setNodeHolder(new NodeHolder(image));
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    public class NodeHolder
    extends ActionMenuCard.NodeHolder {
        public NodeHolder(Image image) {
            super(FXMLFile.PREVIEW_ATTRACTION);
            ImageView imgView = (ImageView)this.getLayout().lookup("#attractionimageview");
            imgView.setImage(image);
            this.lookUpLabels("#attractionnamelabel", "#descriptionlabel", "#pricelabel", "#pricevaluelabel", "#rentlabel", "#if1attractionlabel", "#if1attractionvaluelabel", "#if2attractionlabel", "#if2attractionvaluelabel", "#mortgagelabel", "#mortgagevaluelabel");
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            super.updateLabelTexts(res);
            this.label(0).setText(((Attraction)AttractionPreviewCard.this.getProperty()).getName());
            if (((Attraction)AttractionPreviewCard.this.getProperty()).getOwner() == null) {
                this.update(this.label(1), res, "attraction_forsale", new Object[0]);
            } else if (((Attraction)AttractionPreviewCard.this.getProperty()).isMortgaged()) {
                this.update(this.label(1), res, "attraction_ismortgaged", new Object[0]);
            } else {
                this.update(this.label(1), res, "property_owner", ((Attraction)AttractionPreviewCard.this.getProperty()).getOwner().getUser().getName());
            }
            this.update(this.label(2), res, "property_price", new Object[0]);
            this.label(3).setText(Attraction.PRICE_INFO.getRent(0) + "");
            this.update(this.label(4), res, "property_rent", new Object[0]);
            this.update(this.label(5), res, "attraction_w1", new Object[0]);
            this.update(this.label(6), res, "attraction_Xmultiplier", Attraction.PRICE_INFO.getRent(2));
            this.update(this.label(7), res, "attraction_w2", new Object[0]);
            this.update(this.label(8), res, "attraction_Xmultiplier", Attraction.PRICE_INFO.getRent(3));
            this.update(this.label(9), res, "property_mortgage", new Object[0]);
            this.label(10).setText(Attraction.PRICE_INFO.getRent(1) + "");
        }

        @Override
        protected int[] getLabelsFromInterest() {
            int propertyCount;
            int[] colouredLabels = ((Attraction)AttractionPreviewCard.this.getProperty()).getOwner() == null ? new int[]{2, 3} : (((Attraction)AttractionPreviewCard.this.getProperty()).isMortgaged() ? new int[]{} : ((propertyCount = ((Attraction)AttractionPreviewCard.this.getProperty()).getFieldGroup().getOwnersPropsCount(((Attraction)AttractionPreviewCard.this.getProperty()).getOwner())) == 1 ? new int[]{6} : new int[]{8}));
            return colouredLabels;
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{}";
        }
    }
}

