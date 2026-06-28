/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.model.field.specialfield;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.card.preview.GoToPrisonPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.SpecialField;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;

public class GoToPrisonField
extends SpecialField {
    public static final int POSITION = 30;
    private static GoToPrisonField field;
    private final GoToPrisonPreviewCard previewCard = new GoToPrisonPreviewCard();

    public GoToPrisonField() {
        super(30);
        field = this;
    }

    public static GoToPrisonField getField() {
        return field;
    }

    @Override
    public Card getPreviewCard() {
        return this.previewCard;
    }

    @Override
    public Card createNewPreviewCard() {
        return new GoToPrisonPreviewCard();
    }

    @Override
    public String getName() {
        return GameScene.getResources().getString("gotoprison_name");
    }

    @Override
    public void onFigureEntered(Figure fig, GameHandler handler) {
        handler.placeFigure(fig, handler.getField(40));
    }

    @Override
    public Group draw() {
        Group graphicsGroup = super.draw();
        ImageView imgV = new ImageView(DataLoader.getInstance().getGameImage(GameImage.IC_GO_TO_PRISON));
        imgV.setFitHeight(64.0);
        imgV.setFitWidth(64.0);
        EnhancedGroup imageGrp = new EnhancedGroup();
        AnchorPane pane = new AnchorPane(new Node[]{imgV});
        pane.setPrefWidth(100.0);
        pane.setPrefHeight(150.0);
        this.registerMouseCallbacks((Node)pane);
        imageGrp.getChildren().addAll(new Node[]{pane});
        imageGrp.setRz(180.0);
        imageGrp.setRx(270.0);
        imageGrp.setRy(45.0);
        imageGrp.setTy(11.0);
        imageGrp.setTz(40.0);
        graphicsGroup.getChildren().add(imageGrp);
        return graphicsGroup;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "previewCard=" + this.previewCard + '}';
    }
}

