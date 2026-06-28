/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.image.Image
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.model.field;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.card.AttractionPreviewCard;
import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.field.FieldGroup;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.model.priceinfo.AttractionPriceInfo;
import de.hhn.seb.labsw.laspoly.model.priceinfo.PriceInfo;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;

public class Attraction
extends Property {
    public static final AttractionPriceInfo PRICE_INFO = new AttractionPriceInfo();
    private final Image image;
    private final NodeHolder nodes;
    private final AttractionPreviewCard previewCard;
    private FieldGroup group;

    public Attraction(int pos, String name, Image img) {
        super(pos, name);
        this.image = img;
        this.nodes = new NodeHolder();
        this.previewCard = new AttractionPreviewCard(this, img);
    }

    @Override
    public Card getPreviewCard() {
        return this.previewCard;
    }

    @Override
    public Card createNewPreviewCard() {
        return new AttractionPreviewCard(this, this.image);
    }

    @Override
    public void onFigureEntered(Figure fig, GameHandler handler) {
        Player currentPlayer = handler.getPlayer(fig.getUser());
        if (this.getOwner() == null) {
            handler.showPurchaseDialog(this);
        } else if (!this.isMortgaged() && !this.getOwner().equals(currentPlayer)) {
            int[] lastRoll = currentPlayer.getLastRoll();
            if (lastRoll[0] >= 1) {
            int rent = lastRoll[0] + lastRoll[1];
            if (this.getFieldGroup().ownsAllProps(this.getOwner())) {
                if (currentPlayer.removeMoney(rent *= PRICE_INFO.getRent(3))) {
                    TransactionAction transactionRemove = new TransactionAction(fig.getUser(), rent, false, fig.getUser());
                    handler.addAction(transactionRemove);
                    this.getOwner().addMoney(rent);
                    TransactionAction transactionAdd = new TransactionAction(this.getOwner().getUser(), rent, true, fig.getUser());
                    handler.addAction(transactionAdd);
                } else {
                    handler.kickPlayer(fig.getUser(), "lostNoMoneyLeft");
                }
            } else if (currentPlayer.removeMoney(rent *= PRICE_INFO.getRent(2))) {
                TransactionAction transactionRemove = new TransactionAction(fig.getUser(), rent, false, fig.getUser());
                handler.addAction(transactionRemove);
                this.getOwner().addMoney(rent);
                TransactionAction transactionAdd = new TransactionAction(this.getOwner().getUser(), rent, true, fig.getUser());
                handler.addAction(transactionAdd);
            } else {
                handler.kickPlayer(fig.getUser(), "lostNoMoneyLeft");
            }
            }
        }
    }

    @Override
    public int getPrice() {
        return PRICE_INFO.getRent(0);
    }

    @Override
    public Group draw() {
        Group graphicsGroup = super.draw(90.0);
        graphicsGroup.getChildren().add(this.nodes.imageGroup);
        return graphicsGroup;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "image=" + this.image + ", nodes=" + this.nodes + ", previewCard=" + this.previewCard + ", group=" + this.group + '}';
    }

    @Override
    public PriceInfo getPriceInfo() {
        return PRICE_INFO;
    }

    @Override
    public FieldGroup getFieldGroup() {
        return this.group;
    }

    @Override
    public void setFieldGroup(FieldGroup colourGroup) {
        this.group = colourGroup;
    }

    public class NodeHolder
    extends Property.NodeHolder {
        private final EnhancedGroup imageGroup;

        public NodeHolder() {
            super();
            this.imageGroup = new EnhancedGroup();
            ImageView imgV = new ImageView(Attraction.this.image);
            imgV.setFitHeight(64.0);
            imgV.setFitWidth(64.0);
            AnchorPane pane = this.getTextPane();
            pane.getChildren().clear();
            pane.getChildren().add(imgV);
            AnchorPane.setLeftAnchor((Node)imgV, (Double)18.0);
            AnchorPane.setRightAnchor((Node)imgV, (Double)18.0);
            AnchorPane.setTopAnchor((Node)imgV, (Double)10.0);
            this.imageGroup.getChildren().addAll(new Node[]{pane});
            this.imageGroup.setRz(180.0);
            this.imageGroup.setRx(270.0);
            this.imageGroup.setTy(11.0);
            this.imageGroup.setTx(50.0);
            this.imageGroup.setTz(75.0);
        }

        @Override
        public double getBottomHeight() {
            return super.getBottomHeight() + 10.0;
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{" + "imageGroup=" + this.imageGroup + '}';
        }
    }
}

