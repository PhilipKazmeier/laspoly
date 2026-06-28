package de.hhn.labsw.laspoly.model.action;

/**
 * Everything that happens in a game is an action.
 */
public interface Action {

    /**
     * Method that is called to execute the action.
     */
    public void onAction();

    /**
     * Checks if the action is valid.
     *
     * @return True if the action is valid.
     */
    public boolean isActionValid();
}
