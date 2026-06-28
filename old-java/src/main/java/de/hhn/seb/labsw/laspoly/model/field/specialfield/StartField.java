/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.control.Label
 */
package de.hhn.seb.labsw.laspoly.model.field.specialfield;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.card.StartFieldPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.SpecialField;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.view.View;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.control.Label;

public class StartField
extends SpecialField {
    public static final int POSITION = 0;
    private static StartField field;
    private final StartFieldPreviewCard previewCard = new StartFieldPreviewCard();

    public StartField() {
        super(0);
        field = this;
    }

    public static StartField getField() {
        return field;
    }

    @Override
    public Card getPreviewCard() {
        return this.previewCard;
    }

    @Override
    public Card createNewPreviewCard() {
        return new StartFieldPreviewCard();
    }

    @Override
    public String getName() {
        return GameScene.getResources().getString("startfield_name");
    }

    @Override
    public void onFigureEntered(Figure fig, GameHandler handler) {
    }

    @Override
    public Group draw() {
        Group group = super.draw();
        Label goLabel = new Label();
        goLabel.setFont(View.Fonts.fieldFont(30));
        goLabel.setText(GameScene.getResources().getString("startfield_name"));
        EnhancedGroup goLabelGrp = new EnhancedGroup();
        goLabelGrp.setRz(180.0);
        goLabelGrp.setRx(270.0);
        goLabelGrp.setRy(-45.0);
        goLabelGrp.setTx(62.5);
        goLabelGrp.setTranslateY(11.0);
        goLabelGrp.getChildren().add(goLabel);
        group.getChildren().add(goLabelGrp);
        this.registerMouseCallbacks((Node)group);
        return group;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "previewCard=" + this.previewCard + '}';
    }
}

